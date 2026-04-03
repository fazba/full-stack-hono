import type { RouteObject } from "react-router-dom"

import { AppLayout } from "../components/AppLayout"
import { AccountPage } from "../pages/AccountPage"
import { HomePage } from "../pages/HomePage"
import { LoginPage } from "../pages/LoginPage"
import { RegisterPage } from "../pages/RegisterPage"

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "account", element: <AccountPage /> },
    ],
  },
]
