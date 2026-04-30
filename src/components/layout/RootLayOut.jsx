import React from 'react';
import Header from '../shared/Header';
import { Outlet } from 'react-router';

const RootLayOut = () => {
    return (
        <div>
            <Header/>
            <Outlet/>
        </div>
    );
};

export default RootLayOut;