<script>
    import { onMount } from 'svelte';

    let orders = [];
    let filteredOrders = [];
    let selectedOrder = null;
    let searchQuery = '';

    onMount(async () => {
        await fetchOrders();
    });

    async function fetchOrders() {
        try {
            const response = await fetch('http://localhost:3000/api/get-os');
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            orders = await response.json();
            filteredOrders = orders;
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Função para selecionar uma OS para visualização
    function handleOrderSelection(orderId) {
        console.log('Order ID:', orderId);  // Verifica se a função é chamada e o ID correto é passado
        selectedOrder = orders.find(order => order.id === orderId);
        console.log('Selected Order:', selectedOrder);  // Verifica se a ordem é encontrada e atribuída
    }

    $: filteredOrders = orders.filter(order =>
        (order.cliente_id && order.cliente_id.toLowerCase().includes(searchQuery.toLowerCase())) || 
        (order.observacao && order.observacao.toLowerCase().includes(searchQuery.toLowerCase()))
    );
</script>

<section>
    <h1>Lista de Ordens de Serviço</h1>

    <!-- Campo de pesquisa -->
    <input
        type="text"
        placeholder="Pesquisar por cliente ou observação"
        bind:value={searchQuery}
    />

    <!-- Lista das OS filtradas -->
    <div class="orders-list">
        {#if filteredOrders.length === 0}
            <p>Nenhuma OS encontrada.</p>
        {:else}
            <ul>
                {#each filteredOrders as order (order.id)}
                    <li>
                        <div>
                            <strong>OS #{order.id}</strong> - {new Date(order.data).toLocaleDateString()} <br/>
                            <strong>Valor Total:</strong> R$ {order.valor_total.toFixed(2)} <br/>
                            <strong>Observação:</strong> {order.observacao || 'N/A'} <br/>
                            <button on:click={() => handleOrderSelection(order.id)}>Visualizar</button>
                        </div>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>

    <!-- Exibir detalhes da OS selecionada -->
    {#if selectedOrder}
        <div class="order-details">
            <h2>Detalhes da OS #{selectedOrder.id}</h2>
            <p><strong>Data:</strong> {new Date(selectedOrder.data).toLocaleDateString()}</p>
            <p><strong>Cliente ID:</strong> {selectedOrder.cliente_id}</p>
            <p><strong>Observação:</strong> {selectedOrder.observacao || 'N/A'}</p>
            <p><strong>Total:</strong> R$ {selectedOrder.valor_total.toFixed(2)}</p>
            <p><strong>Itens:</strong></p>
            <ul>
                {#each selectedOrder.itens as item (item.id)}
                    <li>{item.quantidade}x {item.nome} - R$ {item.preco_unitario.toFixed(2)} cada</li>
                {/each}
            </ul>
            <button on:click={() => exportOrderAsPDF(selectedOrder)}>Exportar como PDF</button>
        </div>
    {/if}
</section>
