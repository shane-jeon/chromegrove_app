import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styled from "styled-components";

const CenteredContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #b2f0ff 0%, #e0b3ff 100%);
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(80, 80, 120, 0.12);
  padding: 40px 36px 32px 36px;
  min-width: 350px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 28px;
  color: #23235b;
`;

const StyledForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Label = styled.label`
  font-size: 1rem;
  font-weight: 500;
  color: #23235b;
  margin-bottom: 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1.1rem;
  background: #fafaff;
  margin-top: 4px;
`;

const Button = styled.button`
  width: 100%;
  background: #805ad5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 14px 0;
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 10px;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #6b46c1;
  }
`;

export default function CompleteProfile() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
    }
  }, [user, isLoaded, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const role = localStorage.getItem("signup_role");
    if (!user || !role) {
      alert("Missing user or role information.");
      setLoading(false);
      return;
    }
    const clerk_user_id = user.id;
    const email = user.primaryEmailAddress?.emailAddress || "";
    const res = await fetch("http://localhost:5000/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerk_user_id, email, role, name }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      localStorage.removeItem("signup_role");
      router.replace(`/dashboard/${role}`);
    } else {
      alert("Failed to create user: " + data.error);
    }
  };

  return (
    <CenteredContainer>
      <Card>
        <Title>Create an account</Title>
        <StyledForm onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Create account"}
          </Button>
        </StyledForm>
      </Card>
    </CenteredContainer>
  );
}
