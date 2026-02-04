import { LoginForm } from '../ui/LoginForm';
import { useLoginForm } from '../logic/useLoginForm';

export function LoginFormContainer() {
  const {
    username,
    password,
    showPassword,
    errorMessage,
    isSubmitting,
    canSubmit,
    setUsername,
    setPassword,
    togglePassword,
    handleSubmit,
  } = useLoginForm();

  return (
    <LoginForm
      username={username}
      password={password}
      showPassword={showPassword}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      canSubmit={canSubmit}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onTogglePassword={togglePassword}
      onSubmit={handleSubmit}
    />
  );
}
