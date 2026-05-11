import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const data = await loginUser({ email, password });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/");
    } catch (err) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert(String(err));
      }
    }
  };

  return (
    <main style={styles.page}>
      <section style={styles.container}>
        <div style={styles.leftSide}>
          <h1 style={styles.welcome}>Seja bem-vindo a</h1>

          <div style={styles.logo}>
            opini<span style={styles.logoOn}>ON</span>
          </div>

          <p style={styles.subtitle}>
            A plataforma onde o que<br />
            conta, é a sua opinião!
          </p>
        </div>

        <div style={styles.rightSide}>
          <div style={styles.content}>
            <h2 style={styles.title}>Já tem uma conta?</h2>

            <form onSubmit={handleLogin} style={styles.form}>
              <input
                type="email"
                placeholder="Email"
                style={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Senha"
                style={styles.input}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button type="submit" style={styles.button}>
                Fazer login
              </button>
            </form>

            <div style={styles.divider} />

            <h2 style={styles.title}>É a sua primeira vez?</h2>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => navigate("/cadastro")}
            >
              Crie a sua conta agora
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  container: {
    width: "92vw",
    height: "86vh",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    borderRadius: "26px",
    overflow: "hidden",
    border: "8px solid #d8d3ff",
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
    background: "#fff",
  },
  leftSide: {
    background: "#d8d3ff",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    color: "#6544ad",
    padding: "40px",
  },
  welcome: {
    fontSize: "44px",
    fontWeight: 400,
    margin: "0 0 28px",
  },
  logo: {
    fontSize: "92px",
    fontWeight: 300,
    letterSpacing: "-6px",
    marginBottom: "36px",
  },
  logoOn: {
    fontWeight: 800,
    color: "#6240a8",
  },
  subtitle: {
    fontSize: "30px",
    lineHeight: 1.15,
    margin: 0,
    fontWeight: 400,
  },
  rightSide: {
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "50px",
  },
  content: {
    width: "100%",
    maxWidth: "450px",
  },
  title: {
    fontSize: "42px",
    fontWeight: 400,
    margin: "0 0 28px",
    color: "#050505",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "14px",
    marginBottom: "46px",
  },
  input: {
    width: "100%",
    padding: "15px 18px",
    borderRadius: "999px",
    border: "1px solid #dedaf8",
    background: "#f4f2ff",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  button: {
    width: "160px",
    padding: "13px 22px",
    borderRadius: "999px",
    border: "none",
    background: "#ece9ff",
    color: "#332060",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "13px 26px",
    borderRadius: "999px",
    border: "none",
    background: "#ece9ff",
    color: "#332060",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
  divider: {
    height: "24px",
  },
};