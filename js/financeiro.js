let chartPizza = null;
let chartBarras = null;
let dadosGlobais = []; // Escopo global para os filtros acessarem na memória

document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
    // Carrega os dados vindos do arquivo js/api.js
    dadosGlobais = await carregarDados();
    
    if (!dadosGlobais || dadosGlobais.length === 0) {
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Erro ao conectar ou dados vazios.</span>';
        return;
    }

    statusDiv.style.display = "none";

    // Alimenta os dropdowns com as opções reais extraídas dos dados da planilha
    if (typeof inicializarFiltros === "function") {
        inicializarFiltros(dadosGlobais);
    }

    // Processa a renderização inicial do painel com todos os dados
    processarPainel(dadosGlobais);
});

// Função centralizadora chamada na carga inicial e sempre que um filtro é alterado
function processarPainel(dadosParaExibir) {
    let totalGasto = 0;
    let totalPago = 0;
    let totalPendente = 0;
    
    const linhasTabela = [];
    const categoriasObj = {};
    const centrosObj = {};
    const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    dadosParaExibir.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1;
        const valorParcela = Number(item.valor) || 0;
        
        let dataTexto = item.dataCompra || "";
        let diaBase = 1;
        let mesBase = new Date().getMonth();
        let anoBase = new Date().getFullYear();

        // Faz a leitura limpa da data recebida do Google Sheets (formato ISO)
        if (dataTexto) {
            if (dataTexto.includes("T")) {
                dataTexto = dataTexto.split("T")[0];
            }
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

        // Formatação estrita da Data Compra como DD/MM/AAAA
        const dataCompraFormatada = `${String(diaBase).padStart(2, '0')}/${String(mesBase + 1).padStart(2, '0')}/${anoBase}`;

        // Loop para multiplicar e calcular projeções de parcelamento
        for (let i = 0; i < totalParcelas; i++) {
            let dataParcela = new Date(anoBase, mesBase + i, diaBase);
            
            const vencimentoFormatado = `${mesesAbreviados[dataParcela.getMonth()]}-${dataParcela.getFullYear()}`;

            // CONSULTA DO FILTRO: se a linha/parcela não passar nos critérios, ela é ignorada na soma e visualização
            if (typeof filtrarLinhaIndividual === "function") {
                if (!filtrarLinhaIndividual(vencimentoFormatado, item.conta, item.status, i)) {
                    continue;
                }
            }

            totalGasto += valorParcela;

            let statusParcela = item.status ? item.status.trim().toLowerCase() : "pendente";
            let statusBadgeTexto = item.status || "Pendente";
            
            // Parcelas futuras nascem implicitamente como pendentes
            if (i > 0) {
                statusParcela = "pendente";
                statusBadgeTexto = "Pendente";
            }

            if (statusParcela === "pago") {
                totalPago += valorParcela;
            } else {
                totalPendente += valorParcela;
            }

            const descricaoCustomizada = totalParcelas > 1 
                ? `${item.descricao || "Sem descrição"} (${i + 1}/${totalParcelas})`
                : (item.descricao || "-");

            const subcategoria = item.subcategoria && item.subcategoria.trim() !== "" ? item.subcategoria.trim() : "Outros";
            const centroCusto = item.centroCusto && item.centroCusto.trim() !== "" ? item.centroCusto.trim() : "Geral";
            
            categoriasObj[subcategoria] = (categoriasObj[subcategoria] || 0) + valorParcela;
            centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valorParcela;

            linhasTabela.push(`
                <tr>
                    <td>${dataCompraFormatada}</td>
                    <td><strong>${vencimentoFormatado}</strong></td>
                    <td>${item.fornecedor || "-"}</td>
                    <td>${descricaoCustomizada}</td>
                    <td>R$ ${valorParcela.toFixed(2).replace(".", ",")}</td>
                    <td>${item.conta || "-"}</td>
                    <td><span class="status-badge ${statusParcela}">${statusBadgeTexto}</span></td>
                </tr>
            `);
        }
    });

    // Injeta os resultados filtrados na tela de uma única vez
    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = linhasTabela.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    // Atualiza os componentes de gráficos analíticos
    atualizarGraficosPainel(categoriasObj, centrosObj);
}

function atualizarGraficosPainel(categoriasObj, centrosObj) {
    const coresDinamicas = ['#633bbc', '#00b37e', '#f75a68', '#ffb800', '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'];

    try {
        const ctxPizza = document.getElementById('graficoSubcategorias').getContext('2d');
        if (chartPizza) chartPizza.destroy();
        chartPizza = new Chart(ctxPizza, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoriasObj),
                datasets: [{ data: Object.values(categoriasObj), backgroundColor: coresDinamicas, borderWidth: 2, borderColor: '#1a1a1e' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#c4c4cc' } } } }
        });
    } catch (err) { console.error(err); }

    try {
        const ctxBarras = document.getElementById('graficoCentroCusto').getContext('2d');
        if (chartBarras) chartBarras.destroy();
        chartBarras = new Chart(ctxBarras, {
            type: 'bar',
            data: {
                labels: Object.keys(centrosObj),
                datasets: [{ data: Object.values(centrosObj), backgroundColor: '#633bbc', borderRadius: 4 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#c4c4cc' } },
                    y: { grid: { color: '#29292e' }, ticks: { color: '#c4c4cc' } }
                }
            }
        });
    } catch (err) { console.error(err); }
}
