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
        const totalParcelas = parseInt(item.parcela) || 1;
        const valorParcela = Number(item.valor) || 0;
        
        // Pega qualquer texto de data válido da planilha
        let dataTexto = item.vencimento || item.dataCompra || "";
        let anoBase = new Date().getFullYear();
        let mesBase = new Date().getMonth();
        let diaBase = 1;

        // Limpeza e interpretação nativa de data (Blindagem contra formatos do Sheets)
        if (dataTexto) {
            // Se vier no formato ISO clássico do Apps Script (AAAA-MM-DD...)
            if (dataTexto.includes("-")) {
                const partesISO = dataTexto.split("T")[0].split("-");
                if (partesISO.length === 3) {
                    anoBase = parseInt(partesISO[0]);
                    mesBase = parseInt(partesISO[1]) - 1;
                    diaBase = parseInt(partesISO[2]);
                }
            } else {
                // Remove termos como "de" e limpa espaços (Trata: "29 de mai. de 2026")
                let textoLimpo = dataTexto.replace(/ de /g, " ").replace(/\./g, "").trim();
                const partes = textoLimpo.split(" ");

                if (partes.length >= 3) {
                    diaBase = parseInt(partes[0]) || 1;
                    anoBase = parseInt(partes[partes.length - 1]) || new Date().getFullYear();
                    
                    // Mapeamento de meses em português (caso venha por extenso ou abreviado)
                    const mesesPT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
                    const mesIdentificado = partes[1].toLowerCase().substring(0, 3);
                    const indexMes = mesesPT.indexOf(mesIdentificado);
                    
                    if (indexMes !== -1) {
                        mesBase = indexMes;
                    } else if (!isNaN(partes[1])) {
                        // Se for no formato puro DD/MM/AAAA
                        mesBase = parseInt(partes[1]) - 1;
                    }
                } else if (dataTexto.includes("/")) {
                    // Trata o padrão clássico DD/MM/AAAA
                    const partesBarra = dataTexto.split("/");
                    if (partesBarra.length === 3) {
                        diaBase = parseInt(partesBarra[0]);
                        mesBase = parseInt(partesBarra[1]) - 1;
                        anoBase = parseInt(partesBarra[2]);
                    }
                }
            }
        }

        // 3. Loop para multiplicar as parcelas de forma correta e sequencial
        for (let i = 0; i < totalParcelas; i++) {
            // Cria um objeto Date nativo focado no fuso horário local
            let dataParcela = new Date(anoBase, mesBase + i, diaBase);
            
            // Força a formatação visual correta em padrão brasileiro DD/MM/AAAA
            const dataFormatada = dataParcela.toLocaleDateString("pt-BR");

            // Acumular valores totais
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

            // Alimentação dos dados brutos dos gráficos
            const subcategoria = item.subcategoria || "Outros";
            const centroCusto = item.centroCusto || "Geral";
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

    // 4. Renderiza a tabela inteira na tela de uma só vez
    document.getElementById("tabelaCorpo").innerHTML = linhasTabela.join("");

    // 5. Atualiza os Cartões Indicadores
    document.getElementById("totalGasto").innerText = "R$ " + totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("qtdeLancamentos").innerText = linhasTabela.length;
    document.getElementById("totalPago").innerText = "R$ " + totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
    document.getElementById("totalPendente").innerText = "R$ " + totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

    // 6. Desenha os Gráficos de forma segura
    try {
        const coresDinamicas = ['#633bbc', '#00b37e', '#f75a68', '#ffb800', '#00d2df', '#ff79c6', '#50fa7b', '#ffb86c'];

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
        console.error("Erro ao desenhar os gráficos:", err);
    }
});
