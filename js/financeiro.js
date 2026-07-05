let chartPizza = null;
let chartBarras = null;
let chartMensal = null; // Novo gráfico de evolução mensal
let dadosGlobais = [];

document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
    if (typeof carregarDados !== "function") {
        console.error("A função carregarDados() não foi encontrada. Verifique o arquivo api.js");
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Erro crítico: Script de API não carregado.</span>';
        return;
    }

    try {
        dadosGlobais = await carregarDados();
        
        if (!dadosGlobais || dadosGlobais.length === 0) {
            statusDiv.innerHTML = '<span style="color: #ffb800;">⚠ Planilha conectada, mas nenhum dado foi retornado.</span>';
            return;
        }

        statusDiv.style.display = "none";

        if (typeof inicializarFiltros === "function") {
            inicializarFiltros(dadosGlobais);
        }

        processarPainel(dadosGlobais);

    } catch (erro) {
        console.error("Erro ao carregar dados do painel:", erro);
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Falha na comunicação com o Google Sheets.</span>';
    }
});

function processarPainel(dadosParaExibir) {
    let totalGasto = 0;
    let totalPago = 0;
    let totalPendente = 0;
    
    const parcelasProcessadas = [];
    const categoriesObj = {};
    const centrosObj = {};
    const mesesCronologicosObj = {}; // Estrutura para agrupar despesas por data real de vencimento
    
    const mesesAbreviados = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    dadosParaExibir.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1;
        const valorParcela = Number(item.valor) || 0;
        
        let dataTexto = item.dataCompra ? item.dataCompra.toString().trim() : "";
        
        let diaBase = 1;
        let mesBase = new Date().getMonth();
        let anoBase = new Date().getFullYear();

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

        const objetoDataCompra = new Date(anoBase, mesBase, diaBase);
        const dataCompraFormatada = `${String(diaBase).padStart(2, '0')}/${String(mesBase + 1).padStart(2, '0')}/${anoBase}`;

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
            
            const mesNome = mesesAbreviados[dataParcela.getMonth()];
            const anoNum = dataParcela.getFullYear();
            const vencimentoFormatado = `${mesNome}-${anoNum}`;

            if (typeof filtrarLinhaIndividual === "function") {
                if (!filtrarLinhaIndividual(mesNome, anoNum, item.conta, item.status, i, item)) {
                    continue;
                }
            }

            totalGasto += valorParcela;

            let statusParcela = item.status ? item.status.trim().toLowerCase() : "pendente";
            let statusBadgeTexto = item.status || "Pendente";
            
            if (i > 0) {
                statusParcela = "pendente";
                statusBadgeTexto = "Pendente";
            }

            if (statusParcela === "pago" || statusParcela === "efetuado") {
                totalPago += valorParcela;
            } else {
                totalPendente += valorParcela;
            }

            const descricaoCustomizada = totalParcelas > 1 
                ? `${item.descricao || "Sem descrição"} (${i + 1}/${totalParcelas})`
                : (item.descricao || "-");

            const subcategoria = item.subcategoria && item.subcategoria.trim() !== "" ? item.subcategoria.trim() : "Outros";
            const centroCusto = item.centroCusto && item.centroCusto.trim() !== "" ? item.centroCusto.trim() : "Geral";
            
            categoriesObj[subcategoria] = (categoriesObj[subcategoria] || 0) + valorParcela;
            centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valorParcela;

            // Chave cronológica lógica estável para ordenação perfeita do gráfico de evolução (Ex: "2026-06")
            const chaveCronologica = `${anoNum}-${String(dataParcela.getMonth() + 1).padStart(2, '0')}`;
            if (!mesesCronologicosObj[chaveCronologica]) {
                mesesCronologicosObj[chaveCronologica] = { labelExibicao: vencimentoFormatado, total: 0 };
            }
            mesesCronologicosObj[chaveCronologica].total += valorParcela;

            parcelasProcessadas.push({
                dataOrdenacao: objetoDataCompra,
                dataCompraStr: dataCompraFormatada,
                vencimentoStr: vencimentoFormatado,
                fornecedor: item.fornecedor || "-",
                descricao: descricaoCustomizada,
                valor: valorParcela,
                conta: item.conta || "-",
                statusClasse: statusParcela,
                statusTexto: statusBadgeTexto
            });
        }
    });

    parcelasProcessadas.sort((a, b) => b.dataOrdenacao - a.dataOrdenacao);

    const linesTabela = parcelasProcessadas.map(p => `
        <tr>
            <td>${p.dataCompraStr}</td>
            <td><strong>${p.vencimentoStr}</strong></td>
            <td>${p.fornecedor}</td>
            <td>${p.descricao}</td>
            <td>R$ ${p.valor.toFixed(2).replace(".", ",")}</td>
            <td>${p.conta}</td>
            <td><span class="status-badge ${p.statusClasse}">${p.statusTexto}</span></td>
        </tr>
    `);

    document.getElementById("tabelaCorpo").innerHTML = linesTabela.join("");
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = linesTabela.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    atualizarGraficosPainel(categoriesObj, centrosObj, mesesCronologicosObj);
}

function atualizarGraficosPainel(categoriasObj, centrosObj, mesesCronologicosObj) {
    const coresDinamicas = ['#633bbc', '#00b37e', '#f75a68', '#ffb800', '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'];

    // --- NOVO GRÁFICO: EVOLUÇÃO MENSAL CRONOLÓGICA ---
    try {
        // Ordena as chaves cronológicas ("2026-05", "2026-06", etc.) de forma crescente para o gráfico fazer sentido temporal
        const chavesOrdenadas = Object.keys(mesesCronologicosObj).sort();
        const labelsMensais = chavesOrdenadas.map(chave => mesesCronologicosObj[chave].labelExibicao);
        const valoresMensais = chavesOrdenadas.map(chave => mesesCronologicosObj[chave].total);

        const ctxMensal = document.getElementById('graficoMensal').getContext('2d');
        if (chartMensal) chartMensal.destroy();
        chartMensal = new Chart(ctxMensal, {
            type: 'line', // Estilo de linha contínuo e elegante
            data: {
                labels: labelsMensais,
                datasets: [{
                    label: 'Total Gasto',
                    data: valoresMensais,
                    borderColor: '#996dff',
                    backgroundColor: 'rgba(153, 109, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3, // Deixa as curvas suaves nas pontas
                    pointBackgroundColor: '#996dff'
                }]
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
    } catch (err) { console.error("Erro no gráfico mensal:", err); }

    // --- GRÁFICO 2: SUBCATEGORIAS ---
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

    // --- GRÁFICO 3: CENTRO DE CUSTO ---
    try {
        const ctxBarras = document.getElementById('graficoCentroCusto').getContext('2d');
        if (chartBarras) chartBarras.destroy();
        chartBarras = new Chart(ctxBarras, {
            type: 'bar',
            data: {
                labels: Object.keys(centrosObj),
                datasets: [{ data: Object.values(centrosObj), backgroundColor: '#00b37e', borderRadius: 4 }]
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
