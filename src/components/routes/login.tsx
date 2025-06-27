import { useNavigate } from "react-router";
import { supabase } from "../../api";
import { AuthLayout, Button, Strong } from "../catalyst";
import { Input, InputGroup } from "../catalyst/input";
import { useState } from "react";
export const Login = () => {
  const navigate = useNavigate();
  const [isError, setError] = useState(false);
  const loginPassword = async (evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    const form = evt.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
      throw new Error("Please fill all fields");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (!error) {
      navigate("/");
    } else {
      setError(true);
    }

    console.log(data, error);
  };

  return (
    <form onSubmit={loginPassword}>
      <AuthLayout>
        <InputGroup>
          <Input type="email" name="email" placeholder="email" />
        </InputGroup>
        <InputGroup>
          <Input type="password" name="password" placeholder="password" />
        </InputGroup>
        {isError && <Strong>Incorrect login or password</Strong>}
        <Button color="violet" type="submit">
          submit
        </Button>
      </AuthLayout>
    </form>
  );
};
