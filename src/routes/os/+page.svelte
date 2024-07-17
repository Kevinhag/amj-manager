<script>
	import { onMount } from 'svelte';
	import Reorderable from '$lib/Reorderable.svelte';
	import html2pdf from 'html2pdf.js';

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

	let message = '';
	let type = 'info'; // 'info', 'error', 'success'

	$: selectedPartData = parts.find((part) => part.id == selectedPart);
	$: selectedCarData = cars.find((car) => car.id == selectedCar);
	$: selectedClientData = clients.find((client) => client.id == selectedClient);

	$: filteredClients = clients.filter(
		(client) =>
			client.nome.toLowerCase().includes(searchQuery) ||
			client.cpf.toLowerCase().includes(searchQuery)
	);
	$: filteredParts = parts.filter(
		(part) =>
			part.nome.toLowerCase().includes(searchPartQuery) ||
			part.marca.toLowerCase().includes(searchPartQuery)
	);

	onMount(() => {
		fetchData();
	});

	async function fetchData() {
		try {
			const [carResponse, partResponse, clientResponse] = await Promise.all([
				fetch('http://localhost:3000/api/cars'),
				fetch('http://localhost:3000/api/parts'),
				fetch('http://localhost:3000/api/clients')
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
			showNotification('Please fill in all required fields.', 'error');
			return;
		}

		if (!confirm("Are you sure you want to finalize the service order?")) {
			return;
		}

		const data = {
			carroId: selectedCarData.id,
			observacao: 'Additional details here',
			data: new Date().toISOString().slice(0, 10),
			valorTotal: addedParts.reduce((total, part) => total + (part.quantidade * part.preco), 0),
			itens: addedParts
		};

		try {
			const response = await fetch('http://localhost:3000/api/save-os', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
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

	async function pageOS() {
		const newWindow = window.open('', '', 'width=1000,height=auto');
		const totalValue = addedParts.reduce((sum, part) => sum + (part.quantidade * part.preco), 0);
		const currentDate = new Date().toLocaleDateString();

		newWindow.document.write(`
			<html lang="pt-BR">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link rel="preconnect" href="https://fonts.googleapis.com">
				<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
				<link href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&display=swap" rel="stylesheet">
				<title>Auto Mecânica Jorge</title>
				<style>
					body { font-family: 'Roboto Condensed', sans-serif; }
					.bold { font-weight: bold; }
					.container { width: 80%; margin: 0 auto; border: 1px solid #000; padding: 20px; }
					.header { text-align: center; }
					.header h1 { margin: 0; }
					.header p { margin: 5px 0; }
					.info, .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
					.info td { padding: 5px; }
					.table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
					.signature { margin-top: 20px; display: flex; justify-content: space-between; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header bold">
						<h1 class="font-bold">AUTO MECÂNICA JORGE</h1>
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
							<td>Endereço: ${selectedClientData?.endereco || 'N/A'}</td>
							<td>Fone: ${selectedClientData?.tel || 'N/A'}</td>
						</tr>
						<tr>
							<td>Placa Nº: ${selectedCarData?.placa || 'N/A'}</td>
							<td>Carro: ${selectedCarData?.marca || 'N/A'} - ${selectedCarData?.modelo || 'N/A'}</td>
						</tr>
					</table>

					<table class="table">
						<thead>
							<tr>
								<th>Nome</th>
								<th>Marca</th>
								<th>Quantidade</th>
								<th>Preço Unitário</th>
								<th>Preço</th>
							</tr>
						</thead>
						<tbody>
							${addedParts.map((part) => `
								<tr>
									<td>${part.nome}</td>
									<td>${part.marca}</td>
									<td>${part.quantidade}</td>
									<td>R$ ${part.preco.toFixed(2)}</td>
									<td>R$ ${(part.quantidade * part.preco).toFixed(2)}</td>
								</tr>
							`).join('')}
						</tbody>
					</table>

					<div class="signature">
						<div>Assinatura: ___________________________</div>
						<div>TOTAL R$ ${totalValue.toFixed(2)}</div>
					</div>
				</div>
			</body>
			</html>
		`);

		newWindow.document.close();

		const element = document.getElementById('os-content');
		html2pdf()
			.from(element)
			.set({
				margin: 10,
				filename: 'OrdemDeServico.pdf',
				html2canvas: { scale: 2 },
				jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
			})
			.save();
	}

	function showNotification(msg, msgType) {
		message = msg;
		type = msgType;
		setTimeout(() => {
			message = '';
		}, 3000);
	}
</script>

<main>
	<section>
		<div class="form-base">
			<h2>Clientes:</h2>
			<input
				type="text"
				id="search"
				placeholder="Pesquisar Cliente:"
				on:input={handleClientSearch}
			/>
			<select name="clients" id="clients" size="6" bind:value={selectedClient}>
				{#if clients.length === 0}
					<p>Nenhum item encontrado</p>
				{:else}
					{#each filteredClients as client (client.id)}
						<option value={client.id}>{client.nome} - {client.cpf}</option>
					{/each}
				{/if}
			</select>
			<div class="form-details">
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

		<div class="form-base">
			<h2>Carros:</h2>
			<select name="cars" id="cars" size="2" bind:value={selectedCar}>
				{#each cars.filter((car) => car.cliente_id == selectedClient) as car (car.id)}
					<option value={car.id}>
						{car.marca} - {car.modelo} - {car.placa}
					</option>
				{/each}
			</select>
			<div class="form-details">
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

		<div class="part-list">
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
			<button class="add-part" type="button" on:click={addPartList}>Adicionar Peça</button>
		</div>

		<div class="form-base">
			<h2>Ordem de Serviço:</h2>
			<Reorderable bind:list={addedParts} update={(value) => (addedParts = value)} />
			<button type="button" on:click={pageOS}>Visualizar OS</button>
			<button type="button" on:click={saveOrder}>Finalizar OS</button>
			{#if message}
			<div class={`notification ${type}`}>
				{message}
			</div>
			{/if}
		</div>
	</section>
</main>

<style lang="scss">
	section {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		grid-template-rows: repeat(2, 1fr);
		gap: 1rem;
		width: 100%;
		height: 100%;
	}

	.text {
		padding: 0 5px 0 10px;
		border-radius: 5px;
		font-size: 1.5rem;
		font-weight: bold;
		background-color: $darker;
		width: 15px;
	}

	.form-details {
		background-color: $darker;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid $color;
		gap: 10px;
		height: 200px;
		width: 100%;
	}

	.form-base {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	#clients,
	#cars,
	#parts {
		width: 100%;
		height: 100%;
	}

	#cars {
		height: 62px;
	}

	.notification {
		position: relative;
		top: 20px;
		right: 20px;
		padding: 10px;
		border-radius: 8px;
		color: #fff;
		background-color: #333;
	}
	.info { background-color: blue; }
	.error { background-color: red; }
	.success { background-color: green; }
</style>
