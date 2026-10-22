import { useEffect, useState } from "react";
import api, { errorMessage } from "../services/api";

const EMPTY_FORM = {
  codename: "",
  name: "",
  raca_id: "",
  classe_id: "",
  region_id: "",
  age: "",
  height: "",
  description: "",
};

const optionalInt = (value) => (value === "" ? null : parseInt(value, 10));
const optionalFloat = (value) => (value === "" ? null : parseFloat(value));

export default function CharacterRequestForm({ onCreated }) {
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([api.get("/api/racas/"), api.get("/api/classes/")])
      .then(([racas, classesResponse]) => {
        setRaces(racas.data || []);
        setClasses(classesResponse.data || []);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err, "Erro ao carregar raças e classes.")))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name.trim() || !formData.raca_id || !formData.classe_id) {
      setError("Nome, raça e classe são obrigatórios");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/api/characters/requests/", {
        name: formData.name.trim(),
        codename: formData.codename.trim() || null,
        description: formData.description.trim() || null,
        raca_id: parseInt(formData.raca_id, 10),
        classe_id: parseInt(formData.classe_id, 10),
        region_id: optionalInt(formData.region_id),
        age: optionalInt(formData.age),
        height: optionalFloat(formData.height),
      });
      setSuccess("Solicitação enviada! Aguarde a aprovação do mestre.");
      setFormData(EMPTY_FORM);
      onCreated?.();
    } catch (err) {
      setError(errorMessage(err, "Erro ao enviar a solicitação."));
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
