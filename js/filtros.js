// Valores selecionados nos filtros (estado global do filtro)
let filtroVencimentoAtual = "todos";
let filtroContaAtual = "todos";
let filtroStatusAtual = "todos";

/**
 * Inicializa os elementos de filtro na tela, populando as opções dinamicamente
 * com base nos dados reais que vêm do Google Sheets.
 */
function inicializarFiltros(dados) {
    const selectVencimento = document.getElementById("filtroVencimento");
    const selectConta = document.getElementById("filtroConta");
    const selectStatus = document.getElementById("filtroStatus");

    if (!selectVencimento || !selectConta || !selectStatus) {
        console.error("Elementos de filtro não foram encontrados no HTML.");
        return;
    }

    const mesesSet = new Set();
    const contasSet = new Set();
    const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Varre os dados para descobrir quais Meses e Contas existem na planilha
    dados.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1;
        let dataTexto = item.dataCompra || "";
        
        let diaBase = 1;
        let mesBase = new Date().getMonth();
        let anoBase = new Date().getFullYear();

        if (dataTexto && dataTexto.includes("/")) {
            const partes = dataTexto.split("/");
            if (partes.length === 3) {
                diaBase = parseInt(partes[0]);
                mesBase = parseInt(partes[1]) - 1;
                anoBase = parseInt(partes[2]);
            }
        }

        // Adiciona a conta no Set para evitar duplicados
        if (item.conta && item.conta.trim() !== "") {
            contasSet.add(item.conta.trim());
        }

        // Calcula os meses de vencimento de todas as parcelas para popular o filtro cronológico
        for (let i = 0; i < totalParcelas; i++) {
            let dataParcela = new Date(anoBase, mesBase + i, diaBase);
            const vencimentoChave = `${mesesAbreviados[dataParcela.getMonth()]}-${dataParcela.getFullYear()}`;
            mesesSet.add(vencimentoChave);
        }
    });

    // Ordena e popula o select de Vencimentos (Meses)
    // Converte para array para ordenar cronologicamente se necessário, ou mantém a ordem de inserção
    Array.from(mesesSet).forEach(mesAno => {
        const opt = document.createElement("option");
        opt.value = mesAno;
        opt.textContent = mesAno;
        selectVencimento.appendChild(opt);
    });

    // Ordena alfabeticamente e popula o select de Contas
    Array.from(contasSet).sort().forEach(conta => {
        const opt = document.createElement("option");
        opt.value = conta;
        opt.textContent = conta;
        selectConta.appendChild(opt);
    });

    // --- CONFIGURAÇÃO DOS ESCUTADORES DE EVENTOS (LISTENERS) ---
    
    selectVencimento.addEventListener("change", (e) => {
        filtroVencimentoAtual = e.target.value;
        executarFiltragem();
    });

    selectConta.addEventListener("change", (e) => {
        filtroContaAtual = e.target.value;
        executarFiltragem();
    });

    selectStatus.addEventListener("change", (e) => {
        filtroStatusAtual = e.target.value;
        executarFiltragem();
    });
}

/**
 * Função chamada pelo arquivo financeiro.js dentro do loop de parcelas.
 * Retorna TRUE se a linha deve ser exibida ou FALSE se deve ser ocultada.
 */
function filtrarLinhaIndividual(vencimentoLinha, contaLinha, statusLinha, indiceParcela) {
    // 1. Validação do Filtro de Vencimento (Mês-AAAA)
    if (filtroVencimentoAtual !== "todos" && vencimentoLinha !== filtroVencimentoAtual) {
        return false;
    }

    // 2. Validação do Filtro de Conta / Cartão
    if (filtroContaAtual !== "todos" && (contaLinha || "").trim() !== filtroContaAtual) {
        return false;
    }

    // 3. Validação do Filtro de Status (Levando em conta que parcelas > 1 nascem Pendentes)
    let statusRealParcela = (statusLinha || "").trim().toLowerCase();
    if (indiceParcela > 0) {
        statusRealParcela = "pendente";
    }

    if (filtroStatusAtual !== "todos" && statusRealParcela !== filtroStatusAtual) {
        return false;
    }

    return true;
}

/**
 * Dispara o redesenho do painel chamando a função global do financeiro.js
 */
function ejecutarFiltragem() {
    if (typeof processarPainel === "function" && typeof dadosGlobais !== "undefined") {
        processarPainel(dadosGlobais);
    }
}
