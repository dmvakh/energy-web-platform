import { useNavigate } from "react-router";
import { supabase } from "../../api";
import { AuthLayout, Button } from "../catalyst";
import { Input, InputGroup } from "../catalyst/input";
export const Login = () => {
  const navigate = useNavigate();
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
        <Button color="violet" type="submit">
          submit
        </Button>
      </AuthLayout>
    </form>
  );
};
