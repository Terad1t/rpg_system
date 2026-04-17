import { useEffect, useState } from "react";

export default function CharacterRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch("/api/characters/requests/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        let detail = "Erro ao buscar requisições";
        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const errData = await response.json();
            if (errData && typeof errData === "object") {
              if ("detail" in errData) {
                const d = errData.detail;
                detail = typeof d === "string" ? d : JSON.stringify(d, null, 2);
              } else {
                detail = JSON.stringify(errData, null, 2);
              }
            } else {
              detail = String(errData);
            }
          } else {
            const text = await response.text();
            detail = text || detail;
          }
        } catch (e) {
          detail = e?.message || detail;
        }
        throw new Error(detail);
      }

      const data = await response.json();
      setRequests(data || []);
      setError(null);
    } catch (err) {
      console.error("Erro:", err);
      let msg = err;
      if (err && typeof err === "object") {
        msg = err.message || "Erro ao buscar requisições";
      }
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setApprovingId(requestId);

    try {
      const response = await fetch(`/api/characters/requests/${requestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Erro ao aprovar requisição");
      }

      // Atualiza status local
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "approved" } : r))
      );
      setSelectedRequest(null);
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao aprovar: " + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setRejectingId(requestId);

    try {
      const response = await fetch(`/api/characters/requests/${requestId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao rejeitar requisição");
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" } : r))
      );
      setSelectedRequest(null);
    } catch (err) {
      console.error("Erro:", err);
      alert("Erro ao rejeitar: " + err.message);
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return <div className="text-secondary">Carregando requisições...</div>;
  }

  if (error) {
    let errorString = error;
    if (typeof error !== 'string') {
      try {
        errorString = JSON.stringify(error, null, 2);
      } catch {
        errorString = String(error);
      }
    }
    return <div className="text-red-500">Erro: {errorString}</div>;
  }

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold text-orange-500 mb-6">
        Requisições de Personagens
      </h2>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-900 border border-yellow-500 rounded p-4 text-center">
          <div className="text-2xl font-bold text-yellow-100">{pendingRequests.length}</div>
          <div className="text-sm text-yellow-300">Pendentes</div>
        </div>
        <div className="bg-green-900 border border-green-500 rounded p-4 text-center">
          <div className="text-2xl font-bold text-green-100">{approvedRequests.length}</div>
          <div className="text-sm text-green-300">Aprovadas</div>
        </div>
        <div className="bg-red-900 border border-red-500 rounded p-4 text-center">
          <div className="text-2xl font-bold text-red-100">{rejectedRequests.length}</div>
          <div className="text-sm text-red-300">Rejeitadas</div>
        </div>
      </div>

      {/* Requisições Pendentes */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">Aguardando Aprovação</h3>
          <div className="grid grid-cols-1 gap-4">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className={`border rounded p-4 cursor-pointer transition ${
                  selectedRequest?.id === req.id
                    ? "bg-dark-secondary border-orange-500"
                    : "bg-dark-secondary border-dark-border hover:border-orange-500"
                }`}
                onClick={() => setSelectedRequest(req)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-orange-500">{req.name}</h4>
                    <p className="text-sm text-secondary">
                      Codinome: {req.codename || "(não informado)"}
                    </p>
                    <p className="text-sm text-secondary">
                      Raça: {req.raca?.name || req.raca_id} | Classe: {req.classe?.name || req.classe_id}
                    </p>
                    {req.age && (
                      <p className="text-sm text-secondary">Idade: {req.age}</p>
                    )}
                    {req.description && (
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                        "{req.description}"
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(req.id);
                      }}
                      disabled={approvingId === req.id || rejectingId === req.id}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition text-sm"
                    >
                      {approvingId === req.id ? "Aprovando..." : "Aprovar"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(req.id);
                      }}
                      disabled={rejectingId === req.id || approvingId === req.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded transition text-sm"
                    >
                      {rejectingId === req.id ? "Rejeitando..." : "Rejeitar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes da Requisição Selecionada */}
      {selectedRequest && pendingRequests.find((r) => r.id === selectedRequest.id) && (
        <div className="bg-dark-secondary border border-orange-500 rounded p-6 mb-8">
          <h3 className="text-xl font-bold text-orange-500 mb-4">
            Detalhes da Requisição
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-secondary text-sm">Nome</label>
              <p className="text-white font-semibold">{selectedRequest.name}</p>
            </div>
            <div>
              <label className="block text-secondary text-sm">Codinome</label>
              <p className="text-white font-semibold">
                {selectedRequest.codename || "(não informado)"}
              </p>
            </div>
            <div>
              <label className="block text-secondary text-sm">Raça</label>
              <p className="text-white font-semibold">
                {selectedRequest.raca?.name || `ID: ${selectedRequest.raca_id}`}
              </p>
            </div>
            <div>
              <label className="block text-secondary text-sm">Classe</label>
              <p className="text-white font-semibold">
                {selectedRequest.classe?.name || `ID: ${selectedRequest.classe_id}`}
              </p>
            </div>
            <div>
              <label className="block text-secondary text-sm">Idade</label>
              <p className="text-white font-semibold">
                {selectedRequest.age || "(não informada)"}
              </p>
            </div>
            <div>
              <label className="block text-secondary text-sm">Altura</label>
              <p className="text-white font-semibold">
                {selectedRequest.height ? `${selectedRequest.height}m` : "(não informada)"}
              </p>
            </div>
          </div>

          {selectedRequest.description && (
            <div className="mb-4">
              <label className="block text-secondary text-sm mb-2">Descrição</label>
              <p className="text-white text-sm bg-dark border border-dark-border rounded p-3">
                {selectedRequest.description}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(selectedRequest.id)}
              disabled={approvingId === selectedRequest.id || rejectingId === selectedRequest.id}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded transition"
            >
              {approvingId === selectedRequest.id ? "Aprovando..." : "Aprovar Personagem"}
            </button>
            <button
              onClick={() => handleReject(selectedRequest.id)}
              disabled={rejectingId === selectedRequest.id || approvingId === selectedRequest.id}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded transition"
            >
              {rejectingId === selectedRequest.id ? "Rejeitando..." : "Rejeitar Personagem"}
            </button>
            <button
              onClick={() => setSelectedRequest(null)}
              className="bg-dark-secondary hover:bg-dark-tertiary border border-dark-border text-secondary font-bold py-2 px-6 rounded transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Requisições Aprovadas */}
      {approvedRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-green-400 mb-4">Aprovadas</h3>
          <div className="grid grid-cols-1 gap-2">
            {approvedRequests.map((req) => (
              <div
                key={req.id}
                className="border border-dark-border rounded p-3 bg-dark-secondary text-sm"
              >
                <span className="text-green-400 font-semibold">{req.name}</span> -{" "}
                <span className="text-secondary">
                  {req.raca?.name || `Raça ${req.raca_id}`} |{" "}
                  {req.classe?.name || `Classe ${req.classe_id}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="bg-dark-secondary border border-dark-border rounded p-6 text-center text-secondary">
          Nenhuma requisição de personagem.
        </div>
      )}
    </div>
  );
}
