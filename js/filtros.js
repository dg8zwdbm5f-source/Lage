// Variáveis globais de controle de estado do filtro
let filtroTextoAtual = "";
let filtroMesAtual = "todos";
let filtroAnoAtual = "todos";
let filtroContaAtual = "todos";
let filtroStatusAtual = "todos";

/**
 * Coleta os dados reais, separa Mês e Ano, ordena os arrays
 * de menor para maior e injeta nos dropdowns correspondentes.
 */
function inicializarFiltros(dados) {
    const inputTexto = document.getElementById("filtroTexto");
    const selectMes = document.getElementById("filtroMes");
    const selectAno = document.getElementById("filtroAno");
    const selectConta = document.getElementById("filtroConta");
    const selectStatus = document.getElementById("filtroStatus");
    const btnLimpar = document.getElementById("btnLimparFiltros");

    if (!selectMes || !selectAno || !selectConta || !selectStatus || !inputTexto) {
        console.error("Componentes de filtragem não foram encontrados no HTML.");
        return;
    }

    const mesesSet = new Set();
    const anosSet = new Set();
    const contasSet = new Set();
    
    const mesesReferencia = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    dados.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1;
        let dataTexto = item.dataCompra ? item.dataCompra.toString().trim() : "";
        
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

        let vencimentoTexto = item.vencimento ? item.vencimento.toString().trim() : "";
        let mesVencimentoBase = mesBase; 
        let anoVencimentoBase = anoBase;

        if (vencimentoTexto) {
            if (vencimentoTexto.includes("T")) vencimentoTexto = vencimentoTexto.split("T")[0];
            if (vencimentoTexto.includes("-")) {
                const partesV = vencimentoTexto.split("-");
                if (partesV.length === 3) {
                    anoVencimentoBase = parseInt(partesV[0]);
                    mesVencimentoBase = parseInt(partesV[1]) - 1;
                }
            } else if (vencimentoTexto.includes("/")) {
                const partesV = vencimentoTexto.split("/");
                if (partesV.length === 3) {
                    mesVencimentoBase = parseInt(partesV[1]) - 1;
                    anoVencimentoBase = parseInt(partesV[2]);
                }
            }
        } else {
            mesVencimentoBase = mesBase + 1;
        }

        for (let i = 0; i < totalParcelas; i++) {
            let dataParcela = new Date(anoVencimentoBase, mesVencimentoBase + i, 1);
            mesesSet.add(mesesReferencia[dataParcela.getMonth()]);
            anosSet.add(dataParcela.getFullYear());
        }
    });

    // 1. POPULAR DROPDOWN DE MESES
    const mesesOrdenados = Array.from(mesesSet).sort((a, b) => {
        return mesesReferencia.indexOf(a) - mesesReferencia.indexOf(b);
    });
    mesesOrdenados.forEach(mes => {
        const opcao = document.createElement("option");
        opcao.value = mes;
        opcao.textContent = mes;
        selectMes.appendChild(opcao);
    });

    // 2. POPULAR DROPDOWN DE ANOS
    const anosOrdenados = Array.from(anosSet).sort((a, b) => a - b);
    anosOrdenados.forEach(ano => {
        const opcao = document.createElement("option");
        opcao.value = ano.toString();
        opcao.textContent = ano;
        selectAno.appendChild(opcao);
    });

    // 3. POPULAR DROPDOWN DE CONTAS
    Array.from(contasSet).sort().forEach(conta => {
        const opcao = document.createElement("option");
        opcao.value = conta;
        opcao.textContent = conta;
        selectConta.appendChild(opcao);
    });

    // --- ESCUTADORES DE EVENTO (LISTENERS) ---
    
    inputTexto.addEventListener("input", (e) => {
        filtroTextoAtual = e.target.value.toLowerCase().trim();
        dispararRedesenhoPainel();
    });

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

    if (btnLimpar) {
        btnLimpar.addEventListener("click", () => {
            filtroTextoAtual = "";
            filtroMesAtual = "todos";
            filtroAnoAtual = "todos";
            filtroContaAtual = "todos";
            filtroStatusAtual = "todos";

            inputTexto.value = "";
            selectMes.value = "todos";
            selectAno.value = "todos";
            selectConta.value = "todos";
            selectStatus.value = "todos";

            dispararRedesenhoPainel();
        });
    }
}

/**
 * Validador executado linha por linha.
 */
function filtrarLinhaIndividual(mesLinha, anoLinha, contaLinha, statusLinha, indiceParcela, itemOriginal) {
    // 1. CORREÇÃO DA VALIDAÇÃO DO FILTRO DE TEXTO
    if (filtroTextoAtual !== "") {
        // Acessa de forma segura os dados originais passados pelo loop principal
        const fornecedor = itemOriginal && itemOriginal.fornecedor ? itemOriginal.fornecedor.toString().toLowerCase() : "";
        const descricao = itemOriginal && itemOriginal.descricao ? itemOriginal.descricao.toString().toLowerCase() : "";
        
        if (!fornecedor.includes(filtroTextoAtual) && !descricao.includes(filtroTextoAtual)) {
            return false;
        }
    }

    // 2. Filtro de Mês
    if (filtroMesAtual !== "todos" && mesLinha !== filtroMesAtual) {
        return false;
    }

    // 3. Filtro de Ano
    if (filtroAnoAtual !== "todos" && anoLinha.toString() !== filtroAnoAtual) {
        return false;
    }

    // 4. Filtro de Conta
    if (filtroContaAtual !== "todos" && (contaLinha || "").trim() !== filtroContaAtual) {
        return false;
    }

    // 5. Filtro de Status
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
