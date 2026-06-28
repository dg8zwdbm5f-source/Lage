// Variáveis para controle dos gráficos
let chartPizza = null;
let chartBarras = null;

document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
    // 1. Puxa os dados da API
    const dados = await carregarDados();
    
    if (!dados || dados.length === 0) {
        statusDiv.innerHTML = '<span style="color: #f75a68;">❌ Erro ao conectar ou dados vazios.</span>';
        return;
    }

    statusDiv.style.display = "none";

    let totalGasto = 0;
    let totalPago = 0;
    let totalPendente = 0;
    
    const linhasTabela = [];
    const categoriasObj = {};
    const centrosObj = {};

    // 2. Processa os dados (Tabela + Agrupamento dos Gráficos)
    dados.forEach(item => {
        const valor = Number(item.valor) || 0;
        totalGasto += valor;

        // Separação de Status
        const statusLimpo = item.status ? item.status.trim().toLowerCase() : "";
        if (statusLimpo === "pago") {
            totalPago += valor;
        } else {
            totalPendente += valor;
        }

        // Agrupamento para os gráficos
        const subcategoria = item.subcategoria || "Outros";
        const centroCusto = item.centroCusto || "Geral";
        categoriasObj[subcategoria] = (categoriasObj[subcategoria] || 0) + valor;
        centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valor;

        // Formatação de data
        let dataFormatada = item.dataCompra;
        if (dataFormatada && dataFormatada.includes("T")) {
            dataFormatada = new Date(dataFormatada).toLocaleDateString("pt-BR");
        }

        linhasTabela.push(`
            <tr>
                <td>${dataFormatada || "-"}</td>
                <td>${item.fornecedor || "-"}</td>
                <td>${item.descricao || "-"}</td>
                <td>R$ ${valor.toFixed(2).replace(".", ",")}</td>
                <td>${item.conta || "-"}</td>
                <td><span class="status-badge ${statusLimpo}">${item.status || "Pendente"}</span></td>
            </tr>
        `);
    });

    // 3. Injeta as linhas na tabela
    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");

    // 4. Alimenta os cartões
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = dados.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    // 5. Renderiza os Gráficos de forma segura
    try {
        const coresDinamicas = ['#633bbc', '#00b37e', '#f75a68', '#ffb800', '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'];

        // Gráfico de Pizza/Rosca
        const ctxPizza = document.getElementById('graficoSubcategorias').getContext('2d');
        if (chartPizza) chartPizza.destroy();
        chartPizza = new Chart(ctxPizza, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoriasObj),
                datasets: [{
                    data: Object.values(categoriasObj),
                    backgroundColor: coresDinamicas,
                    borderWidth: 2,
                    borderColor: '#1a1a1e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#c4c4cc' } }
                }
            }
        });

        // Gráfico de Barras
        const ctxBarras = document.getElementById('graficoCentroCusto').getContext('2d');
        if (chartBarras) chartBarras.destroy();
        chartBarras = new Chart(ctxBarras, {
            type: 'bar',
            data: {
                labels: Object.keys(centrosObj),
                datasets: [{
                    data: Object.values(centrosObj),
                    backgroundColor: '#633bbc',
                    borderRadius: 4
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
    } catch (err) {
        console.error("Erro ao construir os gráficos:", err);
    }
});
