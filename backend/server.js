const express = require("express");
const cors = require("cors");
const mysql = require("mysql");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", 
  database: "Expense",
});

// Connect DB
db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
    return;
  }
  console.log("✅ MySQL connected...");
});

// ==================== SIGNUP API ====================
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const checkSql = "SELECT * FROM signup WHERE email = ?";
    db.query(checkSql, [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      if (result.length > 0) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const insertSql = "INSERT INTO signup (`name`,`email`,`password`) VALUES (?, ?, ?)";

      db.query(insertSql, [name, email, hashedPassword], (err, data) => {
        if (err) {
          console.error(err);
          return res.status(500).json(err);
        }

        return res.status(200).json({
          message: "User created successfully",
          userId: data.insertId,
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
});

// ==================== LOGIN API ====================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM signup WHERE email = ?";

  db.query(sql, [email], async (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    if (data.length === 0) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const user = data[0];

    try {
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          message: "Invalid password",
        });
      }

      return res.status(200).json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Server error",
      });
    }
  });
});

// ==================== CHECK IF GOAL EXISTS FOR MONTH ====================
app.get("/goals/check/:email/:month", (req, res) => {
  const { email, month } = req.params;

  const sql = "SELECT id FROM goals WHERE user_email = ? AND month = ? LIMIT 1";

  db.query(sql, [email, month], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    if (result.length > 0) {
      return res.json({
        exists: true,
        goalId: result[0].id,
        message: "Goal already exists for this month"
      });
    }

    res.json({
      exists: false,
      message: "No goal for this month"
    });
  });
});

// ==================== CREATE OR UPDATE GOAL ====================
app.post("/goals", (req, res) => {
  const { userEmail, month, totalLimit, categories, goalId } = req.body;

  if (!userEmail || !month || !totalLimit) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (goalId) {
    // ============ UPDATE EXISTING GOAL ============
    db.query(
      "UPDATE goals SET total_limit = ? WHERE id = ? AND user_email = ?",
      [totalLimit, goalId, userEmail],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json(err);
        }

        // Delete old categories and bills
        db.query(
          "DELETE FROM bills WHERE goal_id = ?",
          [goalId],
          (err1) => {
            if (err1) {
              console.error(err1);
              return res.status(500).json(err1);
            }

            db.query(
              "DELETE FROM goal_categories WHERE goal_id = ?",
              [goalId],
              (err2) => {
                if (err2) {
                  console.error(err2);
                  return res.status(500).json(err2);
                }

                // Insert new categories
                if (categories && categories.length > 0) {
                  const catValues = categories.map(c => [
                    goalId,
                    c.label,
                    c.limit
                  ]);

                  db.query(
                    "INSERT INTO goal_categories (goal_id, label, limit_amount) VALUES ?",
                    [catValues],
                    (err3) => {
                      if (err3) {
                        console.error(err3);
                        return res.status(500).json(err3);
                      }

                      // Get inserted categories
                      db.query(
                        "SELECT id, label, limit_amount FROM goal_categories WHERE goal_id = ?",
                        [goalId],
                        (err4, cats) => {
                          if (err4) {
                            console.error(err4);
                            return res.status(500).json(err4);
                          }

                          if (cats.length > 0) {
                            const billValues = cats.map(cat => [
                              goalId,
                              cat.id,
                              cat.label,
                              cat.limit_amount,
                              `${month}-28`,
                              "pending"
                            ]);

                            db.query(
                              "INSERT INTO bills (goal_id, category_id, name, amount, due_date, status) VALUES ?",
                              [billValues],
                              (err5) => {
                                if (err5) {
                                  console.error(err5);
                                  return res.status(500).json(err5);
                                }

                                res.json({
                                  message: "Goal updated successfully",
                                  goalId: goalId,
                                  action: "updated"
                                });
                              }
                            );
                          } else {
                            res.json({
                              message: "Goal updated successfully",
                              goalId: goalId,
                              action: "updated"
                            });
                          }
                        }
                      );
                    }
                  );
                } else {
                  res.json({
                    message: "Goal updated successfully",
                    goalId: goalId,
                    action: "updated"
                  });
                }
              }
            );
          }
        );
      }
    );
  } else {
    // ============ CREATE NEW GOAL (CHECK FOR DUPLICATE FIRST) ============
    const checkSql = "SELECT id FROM goals WHERE user_email = ? AND month = ? LIMIT 1";

    db.query(checkSql, [userEmail, month], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      if (result.length > 0) {
        return res.status(409).json({
          message: "Goal already exists for this month",
          existingGoalId: result[0].id,
          action: "edit"
        });
      }

      // Create new goal
      const goalSql = "INSERT INTO goals (user_email, month, total_limit) VALUES (?, ?, ?)";

      db.query(goalSql, [userEmail, month, totalLimit], (err, goalResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json(err);
        }

        const newGoalId = goalResult.insertId;

        if (categories && categories.length > 0) {
          const catValues = categories.map(c => [
            newGoalId,
            c.label,
            c.limit
          ]);

          db.query(
            "INSERT INTO goal_categories (goal_id, label, limit_amount) VALUES ?",
            [catValues],
            (err2) => {
              if (err2) {
                console.error(err2);
                return res.status(500).json(err2);
              }

              db.query(
                "SELECT id, label, limit_amount FROM goal_categories WHERE goal_id = ?",
                [newGoalId],
                (err3, cats) => {
                  if (err3) {
                    console.error(err3);
                    return res.status(500).json(err3);
                  }

                  if (cats.length > 0) {
                    const billValues = cats.map(cat => [
                      newGoalId,
                      cat.id,
                      cat.label,
                      cat.limit_amount,
                      `${month}-28`,
                      "pending"
                    ]);

                    db.query(
                      "INSERT INTO bills (goal_id, category_id, name, amount, due_date, status) VALUES ?",
                      [billValues],
                      (err4) => {
                        if (err4) {
                          console.error(err4);
                          return res.status(500).json(err4);
                        }

                        res.json({
                          message: "Goal created successfully with bills",
                          goalId: newGoalId,
                          action: "created"
                        });
                      }
                    );
                  } else {
                    res.json({
                      message: "Goal created successfully",
                      goalId: newGoalId,
                      action: "created"
                    });
                  }
                }
              );
            }
          );
        } else {
          res.json({
            message: "Goal created successfully",
            goalId: newGoalId,
            action: "created"
          });
        }
      });
    });
  }
});

// ==================== GET ALL GOALS & BILLS ====================
app.get("/goals/:email", (req, res) => {
  const email = req.params.email;

  const sql = `
    SELECT g.id, g.month, g.total_limit,
           c.id as category_id, c.label, c.limit_amount,
           b.id as bill_id, b.amount, b.due_date, b.status
    FROM goals g
    LEFT JOIN goal_categories c ON g.id = c.goal_id
    LEFT JOIN bills b ON c.id = b.category_id
    WHERE g.user_email = ?
    ORDER BY g.month DESC, c.id ASC
  `;

  db.query(sql, [email], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    const goalsMap = {};
    const billsSet = new Set();
    const bills = [];

    rows.forEach(r => {
      if (!goalsMap[r.id]) {
        goalsMap[r.id] = {
          id: r.id,
          month: r.month,
          totalLimit: r.total_limit,
          categories: [],
          spent: {},
          notes: ""
        };
      }

      if (r.category_id) {
        const exists = goalsMap[r.id].categories.find(
          c => c.key === r.category_id
        );

        if (!exists) {
          goalsMap[r.id].categories.push({
            key: r.category_id,
            label: r.label,
            limit: r.limit_amount,
            icon: ""
          });

          if (!goalsMap[r.id].spent[r.category_id]) {
            goalsMap[r.id].spent[r.category_id] = 0;
          }
        }
      }

      if (r.bill_id && r.status === "pending") {
        const billKey = `${r.bill_id}`;

        if (!billsSet.has(billKey)) {
          billsSet.add(billKey);
          bills.push({
            id: r.bill_id,
            goalId: r.id,
            categoryId: r.category_id,
            name: r.label,
            amount: r.amount,
            dueDate: r.due_date,
            status: r.status
          });
        }
      }

      if (r.bill_id && r.status === "paid" && r.category_id) {
        if (!goalsMap[r.id].spent[r.category_id]) {
          goalsMap[r.id].spent[r.category_id] = 0;
        }
        goalsMap[r.id].spent[r.category_id] += r.amount;
      }
    });

    res.json({
      goals: Object.values(goalsMap),
      bills: bills
    });
  });
});

// ==================== DELETE GOAL ====================
app.delete("/goals/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM bills WHERE goal_id=?", [id], (err1) => {
    if (err1) {
      console.error(err1);
      return res.status(500).json(err1);
    }

    db.query("DELETE FROM goal_categories WHERE goal_id=?", [id], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json(err2);
      }

      db.query("DELETE FROM goals WHERE id=?", [id], (err3) => {
        if (err3) {
          console.error(err3);
          return res.status(500).json(err3);
        }

        res.json({
          message: "Goal deleted successfully",
          goalId: id
        });
      });
    });
  });
});

// ==================== PAY BILL ====================
app.put("/bills/pay/:id", (req, res) => {
  const billId = req.params.id;

  db.query(
    "SELECT * FROM bills WHERE id=?",
    [billId],
    (err, bills) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      if (bills.length === 0) {
        return res.status(404).json({ message: "Bill not found" });
      }

      const bill = bills[0];

      if (bill.status === "paid") {
        return res.status(400).json({
          message: "Bill already paid",
          billId: billId
        });
      }

      db.query(
        "UPDATE bills SET status = ? WHERE id = ?",
        ["paid", billId],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json(err);
          }

          res.json({
            message: "Bill paid successfully",
            billId: billId,
            amount: bill.amount
          });
        }
      );
    }
  );
});

// ==================== CREATE TRANSACTION ====================
app.post("/transactions", (req, res) => {
  const {
    userEmail,
    date,
    vendor,
    category,
    type,
    amount,
    method,
    reference
  } = req.body;

  if (!userEmail || !date || !vendor || !category || !type || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    INSERT INTO transactions 
    (user_email, date, vendor, category, type, amount, method, reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [userEmail, date, vendor, category, type, amount, method, reference || null],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      res.json({ 
        message: "Transaction added successfully",
        transactionId: result.insertId
      });
    }
  );
});

// ==================== GET TRANSACTIONS BY USER ====================
app.get("/transactions/:email", (req, res) => {
  const email = req.params.email;

  const sql = "SELECT * FROM transactions WHERE user_email = ? ORDER BY date DESC";

  db.query(sql, [email], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});

// ==================== UPDATE TRANSACTION ====================
app.put("/transactions/:id", (req, res) => {
  const { id } = req.params;
  const {
    date,
    vendor,
    category,
    type,
    amount,
    method,
    reference
  } = req.body;

  if (!date || !vendor || !category || !type || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const sql = `
    UPDATE transactions 
    SET date = ?, vendor = ?, category = ?, type = ?, amount = ?, method = ?, reference = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [date, vendor, category, type, amount, method, reference || null, id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ 
        message: "Transaction updated successfully",
        transactionId: id
      });
    }
  );
});

// ==================== DELETE TRANSACTION ====================
app.delete("/transactions/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM transactions WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ 
      message: "Transaction deleted successfully",
      transactionId: id
    });
  });
});

// ==================== DASHBOARD API  ====================

// GET DASHBOARD DATA 
app.get("/dashboard/:email", (req, res) => {
  const email = req.params.email;
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  // Get all transactions for this user filtered by month
  db.query(
    `SELECT * FROM transactions 
     WHERE user_email = ? AND DATE_FORMAT(date, '%Y-%m') = ?
     ORDER BY date DESC`,
    [email, month],
    (err, transactions) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      // Get goal and budget info for selected month
      db.query(
        `SELECT g.id, g.total_limit,
                COALESCE(SUM(gc.limit_amount), 0) as total_category_limits
         FROM goals g
         LEFT JOIN goal_categories gc ON g.id = gc.goal_id
         WHERE g.user_email = ? AND g.month = ?
         GROUP BY g.id`,
        [email, month],
        (err2, goalResult) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json(err2);
          }

          // Get paid bills for this month
          db.query(
            `SELECT b.id, b.amount, b.name, b.due_date, b.status, gc.label as category
             FROM bills b
             JOIN goal_categories gc ON b.category_id = gc.id
             JOIN goals g ON b.goal_id = g.id
             WHERE g.user_email = ? AND g.month = ? AND b.status = 'paid'
             ORDER BY b.due_date DESC`,
            [email, month],
            (err3, paidBills) => {
              if (err3) {
                console.error(err3);
                return res.status(500).json(err3);
              }

              // Calculate totals from transactions
              const totalIncome = transactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);

              const totalExpense = transactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

              // Calculate paid bills total
              const paidBillsTotal = paidBills.reduce((sum, bill) => sum + bill.amount, 0);

              // Total expense = transaction expenses + paid bills
              const totalExpenseWithBills = totalExpense + paidBillsTotal;

              const extraExpense = transactions
                .filter(t => t.type === 'expense' && t.amount > 100)
                .reduce((sum, t) => sum + t.amount, 0);

              // Get overall balance (all-time, not filtered by month)
              db.query(
                `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as balance
                 FROM transactions WHERE user_email = ?`,
                [email],
                (err4, balanceResult) => {
                  if (err4) {
                    console.error(err4);
                    return res.status(500).json(err4);
                  }

                  // Use goal budget if exists, otherwise use default
                  const goalBudget = goalResult.length > 0 ? goalResult[0].total_limit : 3200;
                  
                  // UPDATED: Monthly budget MINUS transaction expenses (deduction from budget)
                  const monthlyBudgetAfterDeduction = goalBudget - totalExpense;
                  
                  const overallBalance = balanceResult[0]?.balance || 0;
                  
                  // UPDATED: Total Balance = Overall Balance + Total Income (this month) + Monthly Budget (after deduction)
                  const totalBalanceCard = overallBalance + totalIncome + monthlyBudgetAfterDeduction;
                  
                  // Budget percent calculated with bills against remaining budget
                  const budgetPercent = monthlyBudgetAfterDeduction > 0 
                    ? Math.min((paidBillsTotal / monthlyBudgetAfterDeduction) * 100, 100) 
                    : 100;
                  
                  // Budget remaining = budget after transaction deduction - paid bills
                  const budgetRemaining = monthlyBudgetAfterDeduction - paidBillsTotal;

                  res.json({
                    balance: totalBalanceCard,
                    overallBalance: overallBalance,
                    originalBudget: goalBudget,
                    monthlyBudget: monthlyBudgetAfterDeduction,
                    totalIncome: totalIncome,
                    totalExpense: totalExpense,
                    paidBillsAmount: paidBillsTotal,
                    totalExpenseWithBills: totalExpenseWithBills,
                    extraExpense: extraExpense,
                    transactions: transactions,
                    paidBills: paidBills,
                    budgetPercent: budgetPercent,
                    netCashFlow: totalIncome - totalExpenseWithBills,
                    budgetRemaining: budgetRemaining,
                    selectedMonth: month,
                    hasGoal: goalResult.length > 0,
                    budgetBreakdown: {
                      originalBudget: goalBudget,
                      transactionDeduction: totalExpense,
                      afterDeduction: monthlyBudgetAfterDeduction,
                      billsAgainstRemaining: paidBillsTotal
                    }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// UPDATE CHART ENDPOINT WITH MONTH FILTER + BILLS
app.get("/dashboard/chart/:email/:filter", (req, res) => {
  const { email, filter } = req.params;
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  // Get transactions
  db.query(
    `SELECT * FROM transactions 
     WHERE user_email = ? AND DATE_FORMAT(date, '%Y-%m') = ?
     ORDER BY date DESC`,
    [email, month],
    (err, transactions) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      // Get paid bills for this month
      db.query(
        `SELECT b.id, b.amount, b.name, b.due_date, b.status, gc.label as category
         FROM bills b
         JOIN goal_categories gc ON b.category_id = gc.id
         JOIN goals g ON b.goal_id = g.id
         WHERE g.user_email = ? AND g.month = ? AND b.status = 'paid'
         ORDER BY b.due_date DESC`,
        [email, month],
        (err2, paidBills) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json(err2);
          }

          let filtered = transactions;

          if (filter === 'expense') {
            filtered = transactions.filter(t => t.type === 'expense');
          } else if (filter === 'income') {
            filtered = transactions.filter(t => t.type === 'income');
          } else if (filter === 'extra') {
            filtered = transactions.filter(t => t.type === 'expense' && t.amount > 100);
          }

          // Group transactions by category
          const categories = {};
          filtered.forEach(t => {
            if (!categories[t.category]) {
              categories[t.category] = 0;
            }
            categories[t.category] += t.amount;
          });

          // Add paid bills to category breakdown (for expense filter only)
          if (filter === 'expense' || filter === 'all') {
            paidBills.forEach(bill => {
              if (!categories[bill.category]) {
                categories[bill.category] = 0;
              }
              categories[bill.category] += bill.amount;
            });
          }

          const colors = ['#30c2b7', '#4ade80', '#60a5fa', '#a78bfa', '#fbbf24', '#f43f5e'];
          
          const chartData = Object.keys(categories)
            .map((cat, index) => ({
              name: cat,
              value: categories[cat],
              color: colors[index % colors.length]
            }))
            .filter(item => item.value > 0);

          res.json(chartData);
        }
      );
    }
  );
});

// GET LAST 5 TRANSACTIONS
app.get("/dashboard/recent/:email", (req, res) => {
  const email = req.params.email;

  db.query(
    "SELECT * FROM transactions WHERE user_email = ? ORDER BY date DESC LIMIT 5",
    [email],
    (err, transactions) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }
      res.json(transactions);
    }
  );
});

// ==================== TEST ROUTE ====================
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});