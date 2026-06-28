// Variáveis globais de controle de estado do filtro
let filtroMesAtual = "todos";
let filtroAnoAtual = "todos";
let filtroContaAtual = "todos";
let filtroStatusAtual = "todos";

/**
 * Coleta os dados reais, separa Mês e Ano, ordena os arrays
 * de menor para maior e injeta nos dropdowns correspondentes.
 */
function inicializarFiltros(dados) {
    const selectMes = document.getElementById("filtroMes");
    const selectAno = document.getElementById("filtroAno");
    const selectConta = document.getElementById("filtroConta");
    const selectStatus = document.getElementById("filtroStatus");

    if (!selectMes || !selectAno || !selectConta || !selectStatus) {
        console.error("Os componentes de filtragem Mês/Ano não foram achados no HTML.");
        return;
    }

    const mesesSet = new Set();
    const anosSet = new Set();
    const contasSet = new Set();
    
    // Lista de referência cronológica para ordenação correta dos meses
    const mesesReferencia = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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

        // Calcula as parcelas futuras para extrair meses e anos reais
        for (let i = 0; i < totalParcelas; i++) {
            let dataParcela = new Date(anoBase, mesBase + i, diaBase);
            mesesSet.add(mesesReferencia[dataParcela.getMonth()]);
            anosSet.add(dataParcela.getFullYear());
        }
    });

    // 1. ORDENAR E POPULAR MESES (Seguindo a ordem cronológica correta de Jan a Dez)
    const mesesOrdenados = Array.from(mesesSet).sort((a, b) => {
        return mesesReferencia.indexOf(a) - mesesReferencia.indexOf(b);
    });
    mesesOrdenados.forEach(mes => {
        const opcao = document.createElement("option");
        opcao.value = mes;
        opcao.textContent = mes;
        selectMes.appendChild(opcao);
    });

    // 2. ORDENAR E POPULAR ANOS (Do menor ano para o maior ano numérico)
    const anosOrdenados = Array.from(anosSet).sort((a, b) => a - b);
    anosOrdenados.forEach(ano => {
        const opcao = document.createElement("option");
        opcao.value = ano.toString();
        opcao.textContent = ano;
        selectAno.appendChild(opcao);
    });

    // 3. ORDENAR E POPULAR CONTAS
    Array.from(contasSet).sort().forEach(conta => {
        const opcao = document.createElement("option");
        opcao.value = conta;
        opcao.textContent = conta;
        selectConta.appendChild(opcao);
    });

    // --- ESCUTADORES DE EVENTO DE MUDANÇA (LISTENERS) ---
    selectMes.addEventListener("change", (e) => {
        filtroMesAtual = e.target.value;
        dispararRedesenhoPainel();
    });

    selectAno.addEventListener("change", (e) => {
        filtroAnoAtual = e.target.value;
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
 * Validador individual executado linha por linha pelo loop principal.
 */
function filtrarLinhaIndividual(mesLinha, anoLinha, contaLinha, statusLinha, indiceParcela) {
    // Validação do Filtro Separado de Mês
    if (filtroMesAtual !== "todos" && mesLinha !== filtroMesAtual) {
        return false;
    }

    // Validação do Filtro Separado de Ano
    if (filtroAnoAtual !== "todos" && anoLinha.toString() !== filtroAnoAtual) {
        return false;
    }

    // Validação do Filtro de Conta / Cartão
    if (filtroContaAtual !== "todos" && (contaLinha || "").trim() !== filtroContaAtual) {
        return false;
    }

    // Validação do Filtro de Status
    let statusRealParcela = (statusLinha || "").trim().toLowerCase();
    if (indiceParcela > 0) {
        statusRealParcela = "pendente";
    }

    if (filtroStatusAtual !== "todos" && statusRealParcela !== filtroStatusAtual) {
        return false;
    }

    return true;
}

function dispararRedesenhoPainel() {
    if (typeof processarPainel === "function" && typeof dadosGlobais !== "undefined") {
        processarPainel(dadosGlobais);
    }
}
