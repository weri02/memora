import { useState, type FormEvent } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function SettingsPage() {
  const { changePassword, isLoading, error, clearError } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError("");
    setSuccess(false);
    clearError();

    // Validacion: la nueva y su confirmacion coinciden
    if (newPassword !== confirmPassword) {
      setLocalError("Las passwords nuevas no coinciden");
      return;
    }

    // Validacion: longitud minima
    if (newPassword.length < 6) {
      setLocalError("La nueva password debe tener al menos 6 caracteres");
      return;
    }

    // Validacion: la nueva debe ser distinta de la actual
    if (newPassword === currentPassword) {
      setLocalError("La nueva password debe ser distinta de la actual");
      return;
    }

    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
    }
  };

  const displayError = localError || error;

  return (
    <div className="max-w-md mx-auto">
      <div
        className="w-full bg-white border-[3px] border-pencil shadow-hand-lg p-8"
        style={{
          borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
        }}
      >
        {/* Titulo */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-pencil mb-2">
            Cambiar contraseña
          </h1>
          <p className="font-body text-lg text-pencil/60">
            Actualiza tu password de acceso
          </p>
        </div>

        {/* Mensaje de exito */}
        {success && (
          <div
            role="status"
            className="mb-4 p-3 bg-green-50 border-2 border-green-600 text-green-700 font-body
              flex items-center justify-center gap-2"
            style={{
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
            }}
          >
            <CheckCircle size={18} strokeWidth={2.5} />
            Contraseña actualizada correctamente
          </div>
        )}

        {/* Error */}
        {displayError && (
          <div
            role="alert"
            className="mb-4 p-3 bg-accent/10 border-2 border-accent text-accent font-body text-center"
            style={{
              borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
            }}
          >
            {displayError}
            <button
              type="button"
              onClick={() => {
                setLocalError("");
                clearError();
              }}
              aria-label="Cerrar error"
              className="ml-2 underline hover:no-underline"
            >
              x
            </button>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password actual */}
          <div>
            <label
              htmlFor="settings-current-password"
              className="font-heading text-lg text-pencil block mb-1"
            >
              Contraseña actual
            </label>
            <input
              id="settings-current-password"
              type={showPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Tu password actual"
              className="w-full px-4 py-3 font-body text-lg bg-white border-2 border-pencil placeholder:text-pencil/40
                focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 focus:outline-none transition-colors"
              style={{
                borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
              }}
            />
          </div>

          {/* Nueva password */}
          <div>
            <label
              htmlFor="settings-new-password"
              className="font-heading text-lg text-pencil block mb-1"
            >
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="settings-new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Minimo 6 caracteres"
                className="w-full px-4 py-3 pr-12 font-body text-lg bg-white border-2 border-pencil placeholder:text-pencil/40 
                  focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 focus:outline-none transition-colors"
                style={{
                  borderRadius: "15px 255px 15px 225px / 225px 15px 255px 15px",
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

          {/* Confirmar nueva password */}
          <div>
            <label
              htmlFor="settings-confirm-password"
              className="font-heading text-lg text-pencil block mb-1"
            >
              Confirmar nueva contraseña
            </label>
            <input
              id="settings-confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Repite la nueva password"
              className="w-full px-4 py-3 font-body text-lg bg-white border-2 border-pencil placeholder:text-pencil/40
                focus:border-accent-blue focus:ring-2 focus:ring-accent-blue/20 focus:outline-none transition-colors"
              style={{
                borderRadius: "255px 15px 225px 15px / 15px 225px 15px 255px",
              }}
            />
          </div>

          {/* Enviar formulario */}
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
            <KeyRound size={20} strokeWidth={2.5} />
            {isLoading ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
