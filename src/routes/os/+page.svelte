<script>
	import { onMount } from 'svelte';
	import Notification from '$lib/Notification.svelte';
	import ConfirmDialog from '$lib/ConfirmDialog.svelte';
	import Reorderable from '$lib/Reorderable.svelte';

	let osItemList = [];
	let parts = [];
	let cars = [];
	let clients = [];
	let addedParts = [];

	let selectedPart = '';
	let selectedCar = '';
	let selectedClient = '';
	let searchQuery = '';
	let searchPartQuery = '';
	let observacao = '';

	let message = '';
	let type = 'info'; // 'info', 'error', 'success'
	let showConfirmDialog = false;
	let confirmMessage = '';
	let onConfirmAction = null;
	let onCancelAction = null;

	$: selectedPartData = parts.find((part) => part.id == selectedPart);
	$: selectedCarData = cars.find((car) => car.id == selectedCar);
	$: selectedClientData = clients.find((client) => client.id == selectedClient);

	$: filteredClients = clients.filter(
		(client) =>
			client.nome.toLowerCase().includes(searchQuery) ||
			client.cpf.toLowerCase().includes(searchQuery),
	);
	$: filteredParts = parts.filter(
		(part) =>
			part.nome.toLowerCase().includes(searchPartQuery) ||
			part.marca.toLowerCase().includes(searchPartQuery),
	);

	onMount(() => {
		fetchData();
	});

	async function fetchData() {
		try {
			const [carResponse, partResponse, clientResponse] = await Promise.all([
				fetch('http://localhost:3000/api/cars'),
				fetch('http://localhost:3000/api/parts'),
				fetch('http://localhost:3000/api/clients'),
			]);

			if (!carResponse.ok || !partResponse.ok || !clientResponse.ok) {
				throw new Error('Failed to fetch data from one or more endpoints');
			}

			cars = await carResponse.json();
			parts = await partResponse.json();
			clients = await clientResponse.json();
		} catch (error) {
			console.error('Error fetching data:', error);
			showNotification('Error fetching data: ' + error.message, 'error');
		}
	}

	async function saveOrder(event) {
		event.preventDefault(); // Prevent default button behavior

		if (!selectedCarData || !selectedClientData || addedParts.length === 0) {
			showNotification('Preencha todos os campos necessários.', 'error');
			return;
		}

		showConfirmation(
			'Deseja finalizar está Ordem de Serviço(OS)?',
			async () => {
				const data = {
					carroId: selectedCarData.id,
					observacao,
					data: new Date().toISOString(),
					valorTotal: addedParts.reduce((total, part) => total + part.quantidade * part.preco, 0),
					itens: addedParts,
				};

				try {
					const response = await fetch('http://localhost:3000/api/save-os', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify(data),
					});

					if (!response.ok) {
						throw new Error('Failed to save service order');
					}

					const result = await response.json();
					console.log('Service order saved successfully:', result);
					showNotification('Service order saved successfully!', 'success');
					await fetchData(); // Refresh data to update DB state
					resetForm();
				} catch (error) {
					console.error('Error saving service order:', error);
					showNotification('Error saving service order: ' + error.message, 'error');
				}
			},
			() => {},
		);
	}

	function resetForm() {
		selectedPart = '';
		selectedCar = '';
		selectedClient = '';
		addedParts = [];
		searchQuery = '';
		searchPartQuery = '';
	}

	function addPartList() {
		if (selectedPartData) {
			addedParts.push({ ...selectedPartData, quantidade: 1, preco: 0 });
			addedParts = [...addedParts];
		} else {
			showNotification('Selected part not found', 'error');
		}
	}

	function handleClientSearch(event) {
		searchQuery = event.target.value.toLowerCase();
	}

	function handlePartSearch(event) {
		searchPartQuery = event.target.value.toLowerCase();
	}

	function pageOS() {
		const totalValue = addedParts.reduce((sum, part) => sum + part.quantidade * part.preco, 0);
		const currentDate = new Date().toLocaleDateString();

		return `
		<html lang="pt-BR">
		<head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>Auto Mecânica Jorge</title>
		  <style>
			body { font-family: 'Arial', sans-serif; }
			.container { width: 95%; margin: 0 auto; padding: 10px; border: 1px solid #333; }
			.header { text-align: center; }
			.header h1 { margin: 0; }
			.header p { margin: 5px 0; }
			.info, .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
			.info td { padding: 5px; }
			.table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
			.signature { margin-top: 20px; display: flex; justify-content: space-between; }
			.qtt {width: 100px;}
			.preco { width: 120px;}
		  </style>
		</head>
		<body>
		  <div class="container">
			<div class="header">
			  <h1>AUTO MECÂNICA JORGE</h1>
			  <p>JTCS Auto Mecânica Ltda. - ME</p>
			  <p>Rua Virgílio Pedro Rubini, 1670 - Barra do Rio Cerro</p>
			  <p>CEP 89260-190 - Jaraguá do Sul - Santa Catarina</p>
			  <p>Fone: (47) 3376-0444</p>
			</div>
			<table class="info">
			  <tr>
				<td>Cliente: ${selectedClientData?.nome || 'N/A'}</td>
				<td>Data: ${currentDate}</td>
			  </tr>
			  <tr>

				<td>Fone: ${selectedClientData?.tel || 'N/A'}</td>
			  </tr>
			  <tr>
				<td>Placa Nº: ${selectedCarData?.placa || 'N/A'}</td>
				<td>Carro: ${selectedCarData?.modelo || 'N/A'}</td>
			  </tr>
			</table>
			<table class="table">
			  <thead>
				<tr>
				  <th>Nome</th>
				  <th class="qtt">Quantidade</th>
				  <th class="preco">Preço Unitário</th>
				  <th class="preco">Preço</th>
				</tr>
			  </thead>
			  <tbody>
				${addedParts
					.map(
						(part) => `
				  <tr>
					<td>${part.nome}</td>
					<td>${part.quantidade}</td>
					<td>R$ ${part.preco.toFixed(2)}</td>
					<td>R$ ${(part.quantidade * part.preco).toFixed(2)}</td>
				  </tr>
				`,
					)
					.join('')}
			  </tbody>
			</table>
			<div class="signature">
			  <div>Assinatura: ___________________________</div>
			  <div>TOTAL R$ ${totalValue.toFixed(2)}</div>
			</div>
		  </div>
		</body>
		</html>
	  `;
	}

	function openPopup() {
		const content = pageOS();
		const newWindow = window.open('', '', 'width=1000,height=auto');
		newWindow.document.write(content);
		newWindow.document.close();
	}

	function saveAsPDF() {
		const content = pageOS();
		window.electron.printToPDF(content);
	}

	function showNotification(msg, msgType) {
		message = msg;
		type = msgType;
		setTimeout(() => {
			message = '';
		}, 3000);
	}

	function showConfirmation(msg, onConfirm, onCancel) {
		confirmMessage = msg;
		onConfirmAction = onConfirm;
		onCancelAction = onCancel;
		showConfirmDialog = true;
	}

	function closeConfirmation() {
		showConfirmDialog = false;
	}

	window.electron.onSavePDF(() => {
		const content = pageOS();
		window.electron.printToPDF(content);
	});
</script>

<section>
	<div class="form-main">
		<!-- Clientes -->
		<div class="form-client" class:active-border={selectedClient !== ''}>
			<h2>Clientes:</h2>
			<input
				type="text"
				id="search"
				placeholder="Pesquisar Cliente:"
				on:input={handleClientSearch}
			/>
			<div class="form-details">
				<select name="clients" id="clients" size="6" bind:value={selectedClient}>
					{#if clients.length === 0}
						<p>Nenhum item encontrado</p>
					{:else}
						{#each filteredClients as client (client.id)}
							<option value={client.id}>{client.nome} - {client.cpf}</option>
						{/each}
					{/if}
				</select>

				<div class="form-details-vis">
					{#if selectedClientData}
						<p>Nome: {selectedClientData.nome}</p>
						<p>CPF: {selectedClientData.cpf}</p>
						<p>Telefone: {selectedClientData.tel}</p>
						<p>Cidade: {selectedClientData.cidade}</p>
					{:else}
						<h3>Nenhum Cliente Selecionado.</h3>
					{/if}
				</div>
			</div>
		</div>

		<!-- Carros -->
		<div class="form-car" class:active-border={selectedCar !== ''}>
			<h2>Carros:</h2>
			<div class="form-details">
				<select name="cars" id="cars" size="4" bind:value={selectedCar}>
					{#each cars.filter((car) => car.cliente_id == selectedClient) as car (car.id)}
						<option value={car.id}>
							{car.marca} - {car.modelo} - {car.placa}
						</option>
					{/each}
				</select>

				<div class="form-details-vis">
					{#if selectedCarData}
						<p>Marca: {selectedCarData.marca}</p>
						<p>Modelo: {selectedCarData.modelo}</p>
						<p>Ano: {selectedCarData.ano}</p>
						<p>Placa: {selectedCarData.placa}</p>
						{#if selectedCarData.observacao}
							<p>Observação: {selectedCarData.observacao}</p>
						{/if}
						{#if selectedCarData.obsretifica}
							<p>Observação Retífica: {selectedCarData.obsretifica}</p>
						{/if}
					{:else}
						<h3>Nenhum Carro Selecionado.</h3>
					{/if}
				</div>
			</div>
		</div>
	</div>
	<div class="form-main">
		<!-- Peças -->
		<div class="part-list" class:active-border={addedParts.length !== 0}>
			<h2>Peças:</h2>
			<input
				type="text"
				id="search"
				placeholder="Pesquisar Peças:"
				on:input={handlePartSearch}
			/>
			<select name="parts" id="parts" size="4" bind:value={selectedPart}>
				{#each filteredParts as part (part.id)}
					<option value={part.id}>
						{part.marca} - {part.nome}
					</option>
				{/each}
			</select>
			<button type="button" on:click={addPartList}>Adicionar</button>
		</div>
	</div>
	<div class="form-main">
		<!-- Ordem de Serviço -->
		<div class="os-part-list">
			<h2 class="grid-item">Ordem de Serviço:</h2>
			<div class="reorderable-container grid-item">
				<Reorderable bind:list={addedParts} update={(value) => (addedParts = value)} />
			</div>
			<div class="grid-item">
				<textarea
					rows="4"
					cols="50"
					placeholder="Observações"
					bind:value={observacao}
					style="resize: none;"
				/>
				<div class="item">
				<button type="button" on:click={openPopup}>Visualizar</button>
				<button type="button" on:click={saveAsPDF}>Exportar PDF</button>
				<button type="button" on:click={saveOrder}>Finalizar</button>
				</div>
			</div>
			{#if message}
				<div class={`notification ${type}`}>
					{message}
				</div>
			{/if}
		</div>
	</div>
	{#if showConfirmDialog}
		<ConfirmDialog
			message={confirmMessage}
			onConfirm={onConfirmAction}
			onCancel={onCancelAction}
		/>
	{/if}
</section>

<style lang="scss">
	section {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		width: 100%;
		height: 100%;
		padding: 10px;
		// background-color: #282828;
		color: #ffffff;
		font-family: 'Arial', sans-serif;
	}

	.text {
		padding: 0 5px 0 10px;
		border-radius: 5px;
		font-size: 1.5rem;
		font-weight: bold;
		background-color: #444;
		width: 15px;
	}

	.form-client,
	.form-car {
		background-color: #44444433;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid #555;
		gap: 10px;
		padding: 10px;
		height: 100%;
		width: 100%;
	}

	.form-details {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		height: 100%;
	}

	.form-details-vis {
		display: flex;
		width: 80%;
		flex-direction: column;
		align-items: start;
		justify-content: center;
		gap: 5px;
		border-radius: 5px;
		overflow-y: auto;
		min-height: 28vh;
		max-height: 28vh;
		background-color: $darker;
	}

	.part-list,
	.form-base,
	.os-part-list {
		background-color: #44444433;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid #555;
		gap: 10px;
		padding: 10px;
		height: 100%;
		width: 100%;
	}

	.os-part-list {
		display: grid;
		grid-template-rows: 40px 1fr 200px;
		// background-color: purple;
	}

	.form-main {
		display: flex;
		flex-direction: column;
		// background-color: aqua;
		height: 100%;
		gap: 10px;
	}

	.grid-item{
		justify-self: center;
	}
	
	.reorderable-container {
		overflow-y: auto;
		width: 100%;
		max-height: 45vh; /* Define a altura máxima conforme necessário */
	}

	#clients,
	#cars,
	#parts {
		width: 100%;
		height: 100%;
		background-color: #444;
		color: #ffffff;
		border: 1px solid #555;
		border-radius: 5px;
	}

	#clients {
		height: 100%;
	}

	#cars {
		height: 100%;
	}

	#parts {
		height: 100%;
	}

	.notification {
		position: absolute;
		top: 50px;
		right: 20px;
		padding: 10px;
		border-radius: 8px;
		color: #fff;
		background-color: #333;
	}
	.info {
		background-color: #5555b9;
		box-shadow: 0 0 20px #5555b9;
	}
	.error {
		background-color: #9b1b1b;
		box-shadow: 0 0 20px #9b1b1b;
	}
	.success {
		background-color: #256d25;
		box-shadow: 0 0 20px #256d25;
	}

	.add-part {
		background-color: #282828;
		color: #ffffff;
		border: 1px solid #555;
		padding: 10px 20px;
		border-radius: 5px;
		cursor: pointer;
	}

	.add-part:hover {
		background-color: #444;
	}

	textarea {
		background-color: #444;
		color: #ffffff;
		border: 1px solid #555;
		border-radius: 5px;
		padding: 10px;
		width: 100%;
		resize: none;
	}

/* 	button {
		background-color: #282828;
		color: #ffffff;
		border: 1px solid #555;
		padding: 10px 20px;
		border-radius: 5px;
		cursor: pointer;
		margin-top: 10px;
	}

	button:hover {
		background-color: #444;
	} */

	.active-border {
		border: 1px solid $color2;
	}
</style>
