import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/documents");
    } catch {
      // Error via store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-md bg-white border-[3px] border-pencil shadow-hand-lg p-8"
        style={{
          borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
        }}
      >
        {/* Titulo */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-4xl font-bold text-pencil mb-2">
            Memora
          </h1>
          <p className="font-body text-xl text-pencil/60">
            Inicia sesion para continuar
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-4 p-3 bg-accent/10 border-2 border-accent text-accent font-body text-center"
            style={{
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
            }}
          >
            {error}
            <button
              type="button"
              onClick={clearError}
              aria-label="Cerrar error"
              className="ml-2 underline hover:no-underline"
            >
              x
            </button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="font-heading text-lg text-pencil block mb-1"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="w-full px-4 py-3 font-body text-lg bg-white border-2 border-pencil
                placeholder:text-pencil/40
                focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 focus:outline-none
                transition-colors"
              style={{
                borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="login-password"
              className="font-heading text-lg text-pencil block mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Tu password"
                className="w-full px-4 py-3 pr-12 font-body text-lg bg-white border-2 border-pencil
                  placeholder:text-pencil/40
                  focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 focus:outline-none
                  transition-colors"
                style={{
                  borderRadius:
                    "15px 255px 15px 225px / 225px 15px 255px 15px",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pencil/50 hover:text-pencil"
              >
                {showPassword ? (
                  <EyeOff size={20} strokeWidth={2.5} />
                ) : (
                  <Eye size={20} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 font-body text-xl
              bg-white text-pencil border-[3px] border-pencil shadow-hand
              hover:bg-accent hover:text-white hover:shadow-hand-sm hover:translate-x-[2px] hover:translate-y-[2px]
              active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-100"
            style={{
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
            }}
          >
            <LogIn size={20} strokeWidth={2.5} />
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* Link a registro */}
        <p className="mt-6 text-center font-body text-lg text-pencil/60">
          No tienes cuenta?{" "}
          <Link
            to="/register"
            className="text-accent-blue underline hover:text-accent transition-colors"
          >
            Registrate aqui
          </Link>
        </p>
      </div>
    </div>
  );
}
