<script>
    import { onMount } from 'svelte';
  
    let date = new Date().toLocaleDateString();
    let clientName = '';
    let address = '';
    let phone = '';
    let carPlate = '';
    let carModel = '';
    let mileage = '';
    let items = [];
    let total = 0;
  
    function addItem() {
      items.push({ quantity: 1, description: '', price: 0 });
      calculateTotal();
    }
  
    function removeItem(index) {
      items.splice(index, 1);
      calculateTotal();
    }
  
    function calculateTotal() {
      total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
  </script>
  
  <style>
    .invoice-container {
      width: 80%;
      margin: 0 auto;
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 5px;
      font-family: Arial, sans-serif;
    }
    .header, .footer {
      text-align: center;
      margin-bottom: 20px;
    }
    .header input, .items input {
      width: 100%;
      padding: 8px;
      margin: 5px 0;
      box-sizing: border-box;
    }
    .items {
      width: 100%;
    }
    .items table {
      width: 100%;
      border-collapse: collapse;
    }
    .items table, .items th, .items td {
      border: 1px solid #000;
    }
    .items th, .items td {
      padding: 10px;
      text-align: left;
    }
    .items .actions {
      text-align: center;
    }
  </style>
  
  <div class="invoice-container">
    <div class="header">
      <h1>Nota Fiscal - Mecânica</h1>
      <div>Data: {date}</div>
    </div>
  
    <div>
      <label>Nome do Cliente</label>
      <input type="text" bind:value={clientName}>
      
      <label>Endereço</label>
      <input type="text" bind:value={address}>
      
      <label>Telefone</label>
      <input type="text" bind:value={phone}>
      
      <label>Placa do Carro</label>
      <input type="text" bind:value={carPlate}>
      
      <label>Modelo do Carro</label>
      <input type="text" bind:value={carModel}>
      
      <label>Quilometragem</label>
      <input type="text" bind:value={mileage}>
    </div>
  
    <div class="items">
      <h2>Peças e Serviços</h2>
      <button on:click={addItem}>Adicionar Item</button>
      <table>
        <thead>
          <tr>
            <th>Quantidade</th>
            <th>Descrição</th>
            <th>Preço</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item, index}
            <tr>
              <td><input type="number" bind:value={item.quantity} min="1" on:input={calculateTotal}></td>
              <td><input type="text" bind:value={item.description}></td>
              <td><input type="number" bind:value={item.price} min="0" step="0.01" on:input={calculateTotal}></td>
              <td class="actions">
                <button on:click={() => removeItem(index)}>Remover</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  
    <div class="footer">
      <h2>Total: R$ {total.toFixed(2)}</h2>
      <div>
        <label>Assinatura:</label>
        <input type="text" placeholder="Assinatura do Cliente">
      </div>
    </div>
  </div>
  