let chartPizza = null;
let chartBarras = null;

document.addEventListener("DOMContentLoaded", async () => {
    const statusDiv = document.getElementById("status-conexao");
    
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

    dados.forEach(item => {
        const totalParcelas = parseInt(item.parcela) || 1;
        const valorParcela = Number(item.valor) || 0;
        
        // Pega as datas originais da API (enviadas em DD/MM/AAAA pelo Apps Script)
        let textoDataCompra = item.dataCompra || "";
        let textoVencimento = item.vencimento || item.dataCompra || "";
        
        let diaBase = 1;
        let mesBase = new Date().getMonth();
        let anoBase = new Date().getFullYear();

        // Processa a data base de vencimento para calcular os meses futuros das parcelas
        if (textoVencimento && textoVencimento.includes("/")) {
            const partes = textoVencimento.split("/");
            if (partes.length === 3) {
                diaBase = parseInt(partes[0]);
                mesBase = parseInt(partes[1]) - 1; 
                anoBase = parseInt(partes[2]);
            }
        }

        // Loop para projetar as parcelas futuras
        for (let i = 0; i < totalParcelas; i++) {
            // Calcula o vencimento subsequente de forma segura
            let dataParcela = new Date(anoBase, mesBase + i, diaBase);
            
            const diaVenc = String(dataParcela.getDate()).padStart(2, '0');
            const mesVenc = String(dataParcela.getMonth() + 1).padStart(2, '0');
            const anoVenc = dataParcela.getFullYear();
            const vencimentoFormatado = `${diaVenc}/${mesVenc}/${anoVenc}`;

            totalGasto += valorParcela;

            // Tratamento de Status
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

            const descricaoCustomizada = totalParcelas > 1 
                ? `${item.descricao || "Sem descrição"} (${i + 1}/${totalParcelas})`
                : (item.descricao || "-");

            const subcategoria = item.subcategoria && item.subcategoria.trim() !== "" ? item.subcategoria.trim() : "Outros";
            const centroCusto = item.centroCusto && item.centroCusto.trim() !== "" ? item.centroCusto.trim() : "Geral";
            
            categoriasObj[subcategoria] = (categoriasObj[subcategoria] || 0) + valorParcela;
            centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valorParcela;

            // Coloca tanto a Data Compra original quanto o Vencimento calculado na tabela
            linhasTabela.push(`
                <tr>
                    <td>${textoDataCompra || "-"}</td>
                    <td>${vencimentoFormatado}</td>
                    <td>${item.fornecedor || "-"}</td>
                    <td>${descricaoCustomizada}</td>
                    <td>R$ ${valorParcela.toFixed(2).replace(".", ",")}</td>
                    <td>${item.conta || "-"}</td>
                    <td><span class="status-badge ${statusParcela}">${statusBadgeTexto}</span></td>
                </tr>
            `);
        }
    });

    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");

    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = linhasTabela.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    const coresDinamicas = ['#633bbc', '#00b37e', '#f75a68', '#ffb800', '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'];

    // Gráfico de Pizza
    try {
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
                plugins: { legend: { position: 'right', labels: { color: '#c4c4cc' } } }
            }
        });
    } catch (err) { console.error(err); }

    // Gráfico de Barras
    try {
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
    } catch (err) { console.error(err); }
});
