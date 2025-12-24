const API_BASE = "/api";
// const API_BASE = "http://localhost:8080";     

export async function loginRequest(email: string, password: string) {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  
    if (!res.ok) {
      throw new Error("Invalid email or password");
    }
  
    return res.json(); // { token, role }
  }
  