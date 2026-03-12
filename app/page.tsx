"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "researcher">("researcher");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!username || !password) {
      setMessage("Username and password are required.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const url =
        mode === "login"
          ? `${API_BASE}/api/auth/login`
          : `${API_BASE}/api/auth/register`;

      const body =
        mode === "login"
          ? { username, password }
          : { username, password, role };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          typeof data.detail === "string"
            ? data.detail
            : "Something went wrong."
        );
        return;
      }

      if (mode === "signup") {
        setMessage("Account created successfully. Please log in.");
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setMessage(`Login successful. Welcome, ${data.user.username}.`);

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/researcher");
      }
    } catch (error) {
      setMessage("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={mode === "login" ? styles.activeTab : styles.tab}
            onClick={() => {
              setMode("login");
              setMessage("");
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={mode === "signup" ? styles.activeTab : styles.tab}
            onClick={() => {
              setMode("signup");
              setMessage("");
            }}
          >
            Sign Up
          </button>
        </div>

        <h2 className={styles.title}>
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === "signup" && (
            <>
              <input
                className={styles.input}
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <select
                className={styles.input}
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "admin" | "researcher")
                }
              >
                <option value="researcher">Researcher</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )}

          <button className={styles.button} type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>

          {message && <p className={styles.message}>{message}</p>}
        </form>
      </div>
    </div>
  );
}