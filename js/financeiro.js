document.addEventListener("DOMContentLoaded", async () => {
    console.log("Iniciando carregamento dos dados financeiros...");
    
    // Chama a função global definida em api.js
    const dados = await carregarDados();
    
    console.log("Dados recebidos da planilha:", dados);

    // Validação simples na tela para termos certeza absoluta
    const mainContainer = document.querySelector("main");
    if (dados && dados.length > 0) {
        mainContainer.innerHTML = `<p style="color: #00ff00;">✔ Sucesso! Encontrados ${dados.length} lançamentos na planilha.</p>`;
    } else {
        mainContainer.innerHTML = `<p style="color: #ff0000;">❌ Nenhum dado encontrado ou erro na conexão. Verifique o Console (F12).</p>`;
    }
});
