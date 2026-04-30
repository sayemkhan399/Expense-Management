import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ExpenseDashboard from './components/ExpenseDashboard';

import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import RootLayOut from './components/layout/RootLayOut.jsx';
import TransactionManager from './components/TransactionManager.jsx';
import MonthlyBudgetGoal from './components/MonthlyBudgetGoal.jsx';
import SignupForm from './components/SignupForm.jsx';
import LoginForm from './components/LoginForm.jsx';
import PrivateRoute from './routes/PrivateRoute.jsx';
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayOut/>,
    children: [
      {
        path: "/",
        element:<PrivateRoute><ExpenseDashboard/></PrivateRoute>,
      },
      {
        path: "/transactions",
        element: <PrivateRoute><TransactionManager/></PrivateRoute>
      },
      {
        path: "/goals",
        element: <PrivateRoute><MonthlyBudgetGoal/></PrivateRoute>
      }
    ]
  },
  {
    path:"/login",
    element:<LoginForm/>
  },
  {
    path:"/signup",
    element:<SignupForm/>
  }
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
