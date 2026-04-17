import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function CharacterRequestForm() {
  const { user } = useAuth();
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    codename: "",
    name: "",
    raca_id: "",
    classe_id: "",
    region_id: "",
    age: "",
    height: "",
    description: "",
  });

  useEffect(() => {
    // Carrega raças e classes disponíveis
    Promise.all([
      fetch("/api/racas", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`Erro ao buscar raças: ${res.status}`);
        return res.json();
      }),
      fetch("/api/classes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }).then((res) => {
        if (!res.ok) throw new Error(`Erro ao buscar classes: ${res.status}`);
        return res.json();
      }),
    ])
      .then(([racasData, classesData]) => {
        setRaces(racasData || []);
        setClasses(classesData || []);
        setError(null);
      })
      .catch((err) => {
        console.error("Erro ao carregar raças e classes:", err);
        setError("Erro ao carregar raças e classes: " + err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    // Validação básica
    if (!formData.name || !formData.raca_id || !formData.classe_id) {
      setError("Nome, raça e classe são obrigatórios");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/characters/requests/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          raca_id: parseInt(formData.raca_id),
          classe_id: parseInt(formData.classe_id),
          region_id: formData.region_id ? parseInt(formData.region_id) : null,
          age: formData.age ? parseInt(formData.age) : null,
          height: formData.height ? parseFloat(formData.height) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao criar request");
      }

      setSuccess("Request de personagem enviado com sucesso! Aguarde a aprovação do mestre.");
      setFormData({
        codename: "",
        name: "",
        raca_id: "",
        classe_id: "",
        region_id: "",
        age: "",
        height: "",
        description: "",
      });

      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Erro:", err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-secondary">Carregando dados...</div>;
  }

  return (
    <div className="p-6 bg-dark-secondary border border-dark-border rounded max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">
        Solicitar Criação de Personagem
      </h2>

      {error && (
        <div className="bg-red-900 border border-red-500 text-red-100 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900 border border-green-500 text-green-100 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-secondary text-sm mb-2">
              Nome do Personagem *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
              placeholder="Ex: Aragorn"
            />
          </div>

          {/* Codinome */}
          <div>
            <label className="block text-secondary text-sm mb-2">
              Codinome (apelido)
            </label>
            <input
              type="text"
              name="codename"
              value={formData.codename}
              onChange={handleChange}
              className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
              placeholder="Ex: O Ranger"
            />
          </div>

          {/* Raça */}
          <div>
            <label className="block text-secondary text-sm mb-2">
              Raça *
            </label>
            <select
              name="raca_id"
              value={formData.raca_id}
              onChange={handleChange}
              required
              className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
            >
              <option value="">Selecione uma raça</option>
              {races.map((race) => (
                <option key={race.id} value={race.id}>
                  {race.name}
                </option>
              ))}
            </select>
          </div>

          {/* Classe */}
          <div>
            <label className="block text-secondary text-sm mb-2">
              Classe *
            </label>
            <select
              name="classe_id"
              value={formData.classe_id}
              onChange={handleChange}
              required
              className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
            >
              <option value="">Selecione uma classe</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Idade */}
          <div>
            <label className="block text-secondary text-sm mb-2">
              Idade
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
              placeholder="Ex: 25"
            />
          </div>

          {/* Altura */}
          <div>
            <label className="block text-secondary text-sm mb-2">
              Altura (metros)
            </label>
            <input
              type="number"
              name="height"
              value={formData.height}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none"
              placeholder="Ex: 1.80"
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-secondary text-sm mb-2">
            Descrição / Lore do Personagem
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="5"
            className="w-full bg-dark border border-dark-border rounded px-3 py-2 text-white focus:border-orange-500 outline-none resize-none"
            placeholder="Conte a história do seu personagem..."
          />
        </div>

        {/* Botão Submit */}
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
          >
            {submitting ? "Enviando..." : "Solicitar Personagem"}
          </button>
        </div>
      </form>

      <p className="text-secondary text-sm mt-4 text-center">
        * Campos obrigatórios. Sua solicitação será revisada pelo mestre.
      </p>
    </div>
  );
}
