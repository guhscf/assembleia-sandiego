import { useState } from "react";
import { supabase } from "../supabase.js";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [cpf, setCpf] = useState("");
  const [bloco, setBloco] = useState("");
  const [apartamento, setApartamento] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!nome || !email || !cpf || !bloco || !apartamento || !senha || !confirmarSenha) {
        Swal.fire("Atenção", "Preencha todos os campos.", "warning");
        setLoading(false);
        return;
      }

      if (senha.length < 8) {
        Swal.fire("Senha fraca", "A senha deve ter pelo menos 8 caracteres.", "warning");
        setLoading(false);
        return;
      }

      if (!/[0-9]/.test(senha) && !/[^a-zA-Z0-9]/.test(senha)) {
        Swal.fire("Senha fraca", "A senha deve conter pelo menos um número ou caractere especial.", "warning");
        setLoading(false);
        return;
      }

      if (senha !== confirmarSenha) {
        Swal.fire("Erro", "As senhas não conferem.", "error");
        setLoading(false);
        return;
      }

      if (!validarCPF(cpf)) {
        Swal.fire("CPF inválido", "Informe um CPF válido.", "warning");
        setLoading(false);
        return;
      }

      const { data: emailExistente } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      const { data: cpfExistente } = await supabase
        .from("usuarios")
        .select("id")
        .eq("cpf", cpf)
        .maybeSingle();

      if (emailExistente) {
        Swal.fire("Erro", "Este e-mail já está cadastrado.", "error");
        setLoading(false);
        return;
      }

      if (cpfExistente) {
        Swal.fire("Erro", "Este CPF já está cadastrado.", "error");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: senha,
      });
      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao criar usuário no Auth.");

      const { error: insertError } = await supabase.from("usuarios").insert([
        {
          id: userId,
          nome,
          email,
          cpf,
          bloco,
          apartamento,
          role: "morador",
          ativo: false,
          data_cadastro: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      Swal.fire({
        title: "Cadastro enviado!",
        html: `
          <p>Seu cadastro foi criado e está aguardando aprovação do administrador.</p>
          <p class="text-gray-600 text-sm mt-2">Você receberá acesso assim que for aprovado.</p>
        `,
        icon: "success",
        confirmButtonColor: "#4f46e5",
      }).then(() => {
        navigate("/");
      });
    } catch {
      Swal.fire("Erro", "Não foi possível realizar o cadastro. Tente novamente.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Gera os apartamentos conforme o padrão definido (101–408)
  const getApartamentosPorBloco = () => {
    const apartamentos = [];
    for (let andar = 1; andar <= 4; andar++) {
      for (let num = 1; num <= 8; num++) {
        apartamentos.push(`${andar}0${num}`);
      }
    }
    return apartamentos;
  };

  const apartamentosDisponiveis = getApartamentosPorBloco();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-white/40 backdrop-blur-md shadow-lg border border-white/30">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2 text-center">
          Crie sua conta<span className="text-indigo-500">.</span>
        </h1>
        <p className="text-center text-gray-600 mb-8 sm:mb-10 text-sm sm:text-base">
          Preencha seus dados para participar das assembleias
        </p>

        <form onSubmit={handleCadastro} className="flex flex-col gap-4 sm:gap-5">
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />
          <input
            type="text"
            placeholder="CPF"
            value={cpf}
            onChange={(e) => setCpf(formatarCPF(e.target.value))}
            maxLength="14"
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />

          {/* Campo de Bloco */}
          <select
            value={bloco}
            onChange={(e) => {
              setBloco(e.target.value);
              setApartamento("");
            }}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 text-sm sm:text-base"
            required
          >
            <option value="">Selecione o bloco</option>
            <option value="1">Bloco 1</option>
            <option value="2">Bloco 2</option>
            <option value="3">Bloco 3</option>
            <option value="4">Bloco 4</option>
          </select>

          {/* Campo de Apartamento */}
          <select
            value={apartamento}
            onChange={(e) => setApartamento(e.target.value)}
            disabled={!bloco}
            className={`w-full p-3 sm:p-4 rounded-xl border border-gray-300 ${
              !bloco ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
            } focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 text-sm sm:text-base`}
            required
          >
            <option value="">
              {bloco ? "Selecione o apartamento" : "Selecione o bloco primeiro"}
            </option>
            {apartamentosDisponiveis.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />
          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full p-3 sm:p-4 rounded-xl border border-gray-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 outline-none transition text-gray-800 placeholder-gray-400 text-sm sm:text-base"
            required
          />

          <div className="flex justify-between text-sm text-indigo-600 mt-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="hover:text-indigo-700 transition"
            >
              Já tenho conta
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-4 py-3 sm:py-4 rounded-xl text-white font-semibold text-lg shadow-md transition-transform transform hover:scale-[1.02] ${
              loading
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-indigo-500 hover:opacity-90"
            }`}
          >
            {loading ? "Enviando..." : "Cadastrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatarCPF(valor) {
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validarCPF(cpf) {
  const nums = cpf.replace(/\D/g, "");
  if (nums.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(nums)) return false; // ex: 111.111.111-11

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(nums[i]) * (10 - i);
  let digito1 = (soma * 10) % 11;
  if (digito1 === 10 || digito1 === 11) digito1 = 0;
  if (digito1 !== parseInt(nums[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(nums[i]) * (11 - i);
  let digito2 = (soma * 10) % 11;
  if (digito2 === 10 || digito2 === 11) digito2 = 0;
  return digito2 === parseInt(nums[10]);
}
