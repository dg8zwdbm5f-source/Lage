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

    // 2. Processa os dados desmembrando os parcelamentos
    dados.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1; // Se for vazio ou 0, vira 1
        const valorTotal = Number(item.valor) || 0;
        
        // O valor na planilha já é o valor da parcela individual? 
        // Se a sua planilha registra o VALOR TOTAL da compra, mude a linha abaixo para: const valorParcela = valorTotal / totalParcelas;
        const valorParcela = valorTotal; 

        // Descobrir a data base de vencimento (usa a coluna vencimento se houver, senão dataCompra)
        let dataBaseStr = item.vencimento || item.dataCompra;
        let dataBase = new Date();

        if (dataBaseStr) {
            // Trata formatos de data ISO ou strings comuns do Sheets
            if (dataBaseStr.includes("T")) {
                dataBase = new Date(dataBaseStr);
            } else {
                const partes = dataBaseStr.split("/");
                if (partes.length === 3) {
                    // Monta no formato Ano-Mês-Dia para o construtor do JS não dar erro de fuso
                    dataBase = new Date(partes[2], partes[1] - 1, partes[0]);
                }
            }
        }

        // Loop para replicar a linha caso seja parcelado
        for (let i = 0; i < totalParcelas; i++) {
            // Calcula o mês subsequente para cada parcela
            let dataParcela = new Date(dataBase.getTime());
            dataParcela.setMonth(dataBase.getMonth() + i);

            const dataFormatada = dataParcela.toLocaleDateString("pt-BR");

            // Acumular valores nos totalizadores globais
            totalGasto += valorParcela;

            // A primeira parcela segue o status da planilha. As parcelas futuras (i > 0) nascem como "Pendente"
            let statusParcela = item.status ? item.status.trim().toLowerCase() : "pendente";
            let statusBadgeTexto = item.status || "Pendente";
            
            if (i > 0) {
                statusParcela = "pendente";
                statusBadgeTexto = "Pendente";
            }

            if (statusParcela === "pago") {
                totalPago += valorParcela;
            } else {
                totalPendente += valorParcela;
            }

            // Customiza a descrição para indicar a parcela (ex: Blusa Inlounge (Pág. 1/5))
            const descricaoCustomizada = totalParcelas > 1 
                ? `${item.descricao || "Sem descrição"} (${i + 1}/${totalParcelas})`
                : (item.descricao || "-");

            // Agrupamento para os gráficos
            const subcategoria = item.subcategoria || "Outros";
            const centroCusto = item.centroCusto || "Geral";
            categoriasObj[subcategoria] = (categoriasObj[subcategoria] || 0) + valorParcela;
            centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valorParcela;

            // Adiciona a linha na tabela de memória
            linhasTabela.push(`
                <tr>
                    <td>${dataFormatada}</td>
                    <td>${item.fornecedor || "-"}</td>
                    <td>${descricaoCustomizada}</td>
                    <td>R$ ${valorParcela.toFixed(2).replace(".", ",")}</td>
                    <td>${item.conta || "-"}</td>
                    <td><span class="status-badge ${statusParcela}">${statusBadgeTexto}</span></td>
                </tr>
            `);
        }
    });

    // 3. Injeta as linhas multiplicadas na tabela
    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");

    // 4. Alimenta os cartões com os novos totais projetados
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = linhasTabela.length; // Quantidade total de parcelas geradas
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    // 5. Renderiza os Gráficos atualizados com as projeções futuras
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
