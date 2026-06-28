// Variáveis de controle de estado dos filtros
let filtroVencimentoAtual = "todos";
let filtroContaAtual = "todos";
let filtroStatusAtual = "todos";

/**
 * Mapeia os dados gerais do Sheets e monta de forma única as opções 
 * de seleção dentro de cada menu dropdown do cabeçalho.
 */
function inicializarFiltros(dados) {
    const selectVencimento = document.getElementById("filtroVencimento");
    const selectConta = document.getElementById("filtroConta");
    const selectStatus = document.getElementById("filtroStatus");

    if (!selectVencimento || !selectConta || !selectStatus) {
        console.error("Os elementos estruturais de filtro não foram encontrados.");
        return;
    }

    // Conjuntos para impedir a duplicação de strings nos dropdowns
    const mesesSet = new Set();
    const contasSet = new Set();
    const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    dados.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1;
        let dataTexto = item.dataCompra || "";
        
        let diaBase = 1;
        let mesBase = new Date().getMonth();
        let anoBase = new Date().getFullYear();

        if (dataTexto) {
            if (dataTexto.includes("T")) dataTexto = dataTexto.split("T")[0];
            if (dataTexto.includes("-")) {
                const partes = dataTexto.split("-");
                if (partes.length === 3) {
                    anoBase = parseInt(partes[0]);
                    mesBase = parseInt(partes[1]) - 1;
                    diaBase = parseInt(partes[2]);
                }
            } else if (dataTexto.includes("/")) {
                const partes = dataTexto.split("/");
                if (partes.length === 3) {
                    diaBase = parseInt(partes[0]);
                    mesBase = parseInt(partes[1]) - 1;
                    anoBase = parseInt(partes[2]);
                }
            }
        }

        if (item.conta && item.conta.trim() !== "") {
            contasSet.add(item.conta.trim());
        }

        // Varre as parcelas calculadas para adicionar os meses de vencimento gerados nas opções
        for (let i = 0; i < totalParcelas; i++) {
            let dataParcela = new Date(anoBase, mesBase + i, diaBase);
            const chaveMesAno = `${mesesAbreviados[dataParcela.getMonth()]}-${dataParcela.getFullYear()}`;
            mesesSet.add(chaveMesAno);
        }
    });

    // Popula o campo dinâmico de Vencimento
    Array.from(mesesSet).forEach(mesAno => {
        const opcao = document.createElement("option");
        opcao.value = mesAno;
        opcao.textContent = mesAno;
        selectVencimento.appendChild(opcao);
    });

    // Popula o campo dinâmico de Contas ordenado alfabeticamente
    Array.from(contasSet).sort().forEach(conta => {
        const opcao = document.createElement("option");
        opcao.value = conta;
        opcao.textContent = conta;
        selectConta.appendChild(opcao);
    });

    // --- ESCUTADORES DE EVENTOS (LISTENERS DE MUDANÇA) ---
    selectVencimento.addEventListener("change", (e) => {
        filtroVencimentoAtual = e.target.value;
        dispararRedesenhoPainel();
    });

    selectConta.addEventListener("change", (e) => {
        filtroContaAtual = e.target.value;
        dispararRedesenhoPainel();
    });

    selectStatus.addEventListener("change", (e) => {
        filtroStatusAtual = e.target.value;
        dispararRedesenhoPainel();
    });
}

/**
 * Validador individual executado linha a linha dentro do loop de parcelas do financeiro.js
 * Retorna true se a parcela atende aos critérios ou false se deve ser ocultada.
 */
function filtrarLinhaIndividual(vencimentoLinha, contaLinha, statusLinha, indiceParcela) {
    if (filtroVencimentoAtual !== "todos" && vencimentoLinha !== filtroVencimentoAtual) {
        return false;
    }

    if (filtroContaAtual !== "todos" && (contaLinha || "").trim() !== filtroContaAtual) {
        return false;
    }

    let statusRealParcela = (statusLinha || "").trim().toLowerCase();
    if (indiceParcela > 0) {
        statusRealParcela = "pendente"; // Parcelas clonadas futuras começam como pendente
    }

    if (filtroStatusAtual !== "todos" && statusRealParcela !== filtroStatusAtual) {
        return false;
    }

    return true;
}

/**
 * Solicita que o processador principal recalcule e redesenhe a tela com os filtros vigentes
 */
function dispararRedesenhoPainel() {
    if (typeof processarPainel === "function" && typeof dadosGlobais !== "undefined") {
        processarPainel(dadosGlobais);
    }
}
