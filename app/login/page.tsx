"use client";

import { useState } from "react";
import styles from "./page.module.css";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <div className={styles.container}>
      <div className={styles.card}>

        <div className={styles.tabs}>
          <button
            className={mode === "login" ? styles.activeTab : styles.tab}
            onClick={() => setMode("login")}
          >
            Login
          </button>

          <button
            className={mode === "signup" ? styles.activeTab : styles.tab}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>

        <h2 className={styles.title}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        <form className={styles.form}>

          {mode === "signup" && (
            <input
              className={styles.input}
              placeholder="Name"
            />
          )}

          <input
            className={styles.input}
            placeholder="Email"
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Password"
          />

          {mode === "signup" && (
            <input
              className={styles.input}
              type="password"
              placeholder="Confirm Password"
            />
          )}

          <button className={styles.button}>
            {mode === "login" ? "Login" : "Create Account"}
          </button>

        </form>

      </div>
    </div>
  );
}