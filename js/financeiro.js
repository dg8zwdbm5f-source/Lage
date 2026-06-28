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
        
        let dataTexto = item.vencimento || item.dataCompra || "";
        let anoBase = new Date().getFullYear();
        let mesBase = new Date().getMonth();
        let diaBase = 1;

        if (dataTexto) {
            if (dataTexto.includes("-")) {
                const partesISO = dataTexto.split("T")[0].split("-");
                if (partesISO.length === 3) {
                    anoBase = parseInt(partesISO[0]);
                    mesBase = parseInt(partesISO[1]) - 1;
                    diaBase = parseInt(partesISO[2]);
                }
            } else {
                let textoLimpo = dataTexto.replace(/ de /g, " ").replace(/\./g, "").trim();
                const partes = textoLimpo.split(" ");

                if (partes.length >= 3) {
                    diaBase = parseInt(partes[0]) || 1;
                    anoBase = parseInt(partes[partes.length - 1]) || new Date().getFullYear();
                    
                    const mesesPT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
                    const mesIdentificado = partes[1].toLowerCase().substring(0, 3);
                    const indexMes = mesesPT.indexOf(mesIdentificado);
                    
                    if (indexMes !== -1) {
                        mesBase = indexMes;
                    } else if (!isNaN(partes[1])) {
                        mesBase = parseInt(partes[1]) - 1;
                    }
                } else if (dataTexto.includes("/")) {
                    const partesBarra = dataTexto.split("/");
                    if (partesBarra.length === 3) {
                        diaBase = parseInt(partesBarra[0]);
                        mesBase = parseInt(partesBarra[1]) - 1;
                        anoBase = parseInt(partesBarra[2]);
                    }
                }
            }
        }

        for (let i = 0; i < totalParcelas; i++) {
            let dataParcela = new Date(anoBase, mesBase + i, diaBase);
            const dataFormatada = dataParcela.toLocaleDateString("pt-BR");

            totalGasto += valorParcela;

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

            // Garante que nomes vazios não quebrem o agrupamento dos gráficos
            const subcategoria = item.subcategoria && item.subcategoria.trim() !== "" ? item.subcategoria.trim() : "Outros";
            const centroCusto = item.centroCusto && item.centroCusto.trim() !== "" ? item.centroCusto.trim() : "Geral";
            
            categoriasObj[subcategoria] = (categoriasObj[subcategoria] || 0) + valorParcela;
            centrosObj[centroCusto] = (centrosObj[centroCusto] || 0) + valorParcela;

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

    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");

    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = linhasTabela.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    const coresDinamicas = ['#633bbc', '#00b37e', '#f75a68', '#ffb800', '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'];

    // --- Tenta desenhar o Gráfico de Pizza ---
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
    } catch (err) {
        console.error("Erro no Gráfico de Pizza:", err);
    }

    // --- Tenta desenhar o Gráfico de Barras ---
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
    } catch (err) {
        console.error("Erro no Gráfico de Barras:", err);
    }
});
