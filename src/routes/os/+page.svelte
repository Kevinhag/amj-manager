<script>
	import { onMount } from 'svelte';
	import Notification from '$lib/components/Notification.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import Reorderable from '$lib/components/Reorderable.svelte';
	import AddPart from '$lib/components/AddPart.svelte';

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

	let formaPagamento = '';
	let parcelas = '';
	let message = '';
	let type = 'info'; // 'info', 'error', 'success'
	let showConfirmDialog = false;
	let confirmMessage = '';
	let onConfirmAction = null;
	let onCancelAction = null;

	let showAddPart = false;

	function openAddPart() {
		showAddPart = true;
	}

	function closeAddPart() {
		showAddPart = false;
		fetchData();
	}

	$: selectedPag = 0;
	$: totalValue = addedParts.reduce((sum, item) => sum + getTotal(item), 0);
	$: selectedPartData = parts.find((part) => part.id == selectedPart);
	$: selectedCarData = cars.find((car) => car.id == selectedCar);
	$: selectedClientData = clients.find((client) => client.id == selectedClient);
	$: filteredClients = clients.filter((client) => {
		const searchLower = searchQuery.toLowerCase();

		// Verificar correspondência nos atributos do cliente
		const clientMatch =
			client.nome.toLowerCase().includes(searchLower) ||
			(client.cpf && client.cpf.toLowerCase().includes(searchLower)) ||
			(client.tel && client.tel.toLowerCase().includes(searchLower)) ||
			(client.tel2 && client.tel2.toLowerCase().includes(searchLower));

		// Obter carros associados ao cliente
		const clientCars = cars.filter((car) => car.cliente_id == client.id);

		// Verificar correspondência nos atributos dos carros
		const carMatch = clientCars.some(
			(car) =>
				(car.modelo && car.modelo.toLowerCase().includes(searchLower)) ||
				(car.placa && car.placa.toLowerCase().includes(searchLower)),
		);

		// Retornar true se houver correspondência no cliente ou nos carros
		return clientMatch || carMatch;
	});
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

		let formaPagCompleta = formaPagamento;
		if (formaPagamento === 'Crédito parcelado' || formaPagamento === 'Parcelado') {
			formaPagCompleta += ` em ${parcelas}`;
		}

		showConfirmation(
			'Deseja finalizar está Ordem de Serviço(OS)?',
			async () => {
				const data = {
					carroId: selectedCarData.id,
					observacao,
					data: new Date().toISOString(),
					valorTotal: addedParts.reduce(
						(total, part) => total + part.quantidade * part.preco,
						0,
					),
					itens: addedParts,
					formaPagamento: formaPagCompleta,
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

		let formaPagCompleta = formaPagamento;
		if (formaPagamento === 'Crédito parcelado' || formaPagamento === 'Parcelado') {
			formaPagCompleta += ` em ${parcelas}`;
		}

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

	function getTotal(item) {
		return item.quantidade * item.preco;
	}

	function currencyFormat(value) {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(value);
	}

	function printOS() {
		const content = pageOS();
		const printWindow = window.open('', '', 'width=1000,height=auto');
		printWindow.document.write(content);
		printWindow.document.close();

		printWindow.onload = () => {
			printWindow.print();
			printWindow.close();
		};
	}

	window.electron.onSavePDF(() => {
		const content = pageOS();
		window.electron.printToPDF(content);
	});
</script>

<link
	rel="stylesheet"
	href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=picture_as_pdf"
/>

<section>
	<div class="form-main">
		{#if showAddPart}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="modal-overlay" on:click={closeAddPart}>
				<div class="modal-content" on:click|stopPropagation>
					<AddPart />
					<button on:click={closeAddPart}>Fechar</button>
				</div>
			</div>
		{/if}

		<!-- Clientes -->
		<div class="form-client" class:active-border={selectedClient}>
			<h2>Clientes:</h2>
			<input
				type="text"
				id="search"
				placeholder="Pesquisar Cliente: Nome, Carro, Placa, Telefone, CPF "
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
		<div class="form-car" class:active-border={selectedCar}>
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
			<div>
				<button type="button" on:click={openAddPart}>Nova Peça</button>
				<button type="button" on:click={addPartList}>Adicionar à OS</button>
			</div>
		</div>
	</div>

	<div class="form-main">
		<!-- Ordem de Serviço -->
		<div
			class="os-part-list"
			class:active-border={addedParts.length !== 0 && selectedClient && selectedCar}
		>
			<h2>Ordem de Serviço:</h2>
			<div class="os-container">
				<div class="reorderable-container">
					<Reorderable bind:list={addedParts} update={(value) => (addedParts = value)} />
				</div>

				<div class="total-container">
					<div>Total: {currencyFormat(totalValue)}</div>
				</div>

				<div>
					<div>
						<label for="form-pag">Forma de pagamento:</label>
						<select name="form-pag" id="form-pag" bind:value={formaPagamento}>
							<option value="" disabled selected hidden>
								Selecione a forma de pagamento
							</option>
							<option value="Crédito á vista">Crédito á vista</option>
							<option value="Crédito parcelado">Crédito parcelado</option>
							<option value="Débito">Débito</option>
							<option value="Pix">Pix</option>
							<option value="Dinheiro">Dinheiro</option>
						</select>
						{#if formaPagamento === 'Crédito parcelado' || formaPagamento === 'Parcelado'}
							<select name="pag-x" id="pag-x" bind:value={parcelas}>
								<option value="1x" selected>1x</option>
								<option value="2x">2x</option>
								<option value="3x">3x</option>
								<option value="4x">4x</option>
								<option value="5x">5x</option>
								<option value="6x">6x</option>
								<option value="7x">7x</option>
								<option value="8x">8x</option>
								<option value="9x">9x</option>
								<option value="10x">10x</option>
								<option value="11x">11x</option>
								<option value="12x">12x</option>
							</select>
						{/if}
					</div>

					<textarea
						rows="4"
						cols="50"
						placeholder="Observações"
						bind:value={observacao}
						style="resize: none;"
					/>
					<div class="item">
						<button type="button" class="icon-button" on:click={openPopup}><svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#e8eaed"><path d="M216-144q-29.7 0-50.85-21.15Q144-186.3 144-216v-528q0-29.7 21.15-50.85Q186.3-816 216-816h528q29.7 0 50.85 21.15Q816-773.7 816-744v528q0 29.7-21.15 50.85Q773.7-144 744-144H216Zm0-72h528v-456H216v456Zm263.88-84Q406-300 348-340.5T264-444q26-63 84.12-103.5 58.11-40.5 132-40.5Q554-588 612-547.5T696-444q-26 63-84.12 103.5-58.11 40.5-132 40.5Zm.12-48q53 0 95.88-25.44Q618.76-398.88 643-444q-24.24-45.12-67.12-70.56Q533-540 480-540q-53 0-95.88 25.44Q341.24-489.12 317-444q24.24 45.12 67.12 70.56Q427-348 480-348Zm0-96Zm0 60q25 0 42.5-17.5T540-444q0-25-17.5-42.5T480-504q-25 0-42.5 17.5T420-444q0 25 17.5 42.5T480-384Z"/></svg></button>
						<button	type="button" class="icon-button" on:click={saveAsPDF}><svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#e8eaed"><path d="M360-456h48v-72h24q20.4 0 34.2-13.8Q480-555.6 480-576v-24q0-20.4-13.8-34.2Q452.4-648 432-648h-72v192Zm48-120v-24h24v24h-24Zm96 120h72q20.4 0 34.2-13.8Q624-483.6 624-504v-96q0-20.4-13.8-34.2Q596.4-648 576-648h-72v192Zm48-48v-96h24v96h-24Zm96 48h48v-72h48v-48h-48v-24h48v-48h-96v192ZM312-240q-29.7 0-50.85-21.15Q240-282.3 240-312v-480q0-29.7 21.15-50.85Q282.3-864 312-864h480q29.7 0 50.85 21.15Q864-821.7 864-792v480q0 29.7-21.15 50.85Q821.7-240 792-240H312Zm0-72h480v-480H312v480ZM168-96q-29.7 0-50.85-21.15Q96-138.3 96-168v-552h72v552h552v72H168Zm144-696v480-480Z"/></svg></button>
						<button type="button" class="icon-button" on:click={printOS}><svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#e8eaed"><path d="M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z"/></svg></button>
						<button type="button" class="icon-button" on:click={saveOrder}><svg xmlns="http://www.w3.org/2000/svg" height="26px" viewBox="0 -960 960 960" width="26px" fill="#e8eaed"><path d="M480-96q-79 0-149-30t-122.5-82.5Q156-261 126-331T96-480q0-80 30-149.5t82.5-122Q261-804 331-834t149-30q63 0 120 19t105 54l-52 52q-37-26-81-39.5T480-792q-130 0-221 91t-91 221q0 130 91 221t221 91q130 0 221-91t91-221q0-21-3-41.5t-8-40.5l57-57q13 32 19.5 67t6.5 72q0 79-30 149t-82.5 122.5Q699-156 629.5-126T480-96Zm-55-211L264-468l52-52 110 110 387-387 51 51-439 439Z"/></svg></button>
					</div>
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
	@import 'src/lib/styles/buttons.scss';
	@import 'src/lib/styles/input.scss';
	@import 'src/lib/styles/select.scss';



	/* Estilos da Seção Principal */
	section {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		width: 100%;
		height: 100%;
		padding: 10px;
		color: #ffffff;

		.form-main {
			display: flex;
			flex-direction: column;
			height: 100%;
			gap: 10px;

			.form-client,
			.form-car {
				background-color: $bgcolorl;
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

				&.active-border {
					border: 1px solid $color2;
				}

				.form-details {
					display: flex;
					flex-direction: row;
					align-items: center;
					justify-content: center;
					gap: 10px;
					width: 100%;
					height: 100%;

					.form-details-vis {
						display: flex;
						width: 80%;
						height: 100%;
						flex-direction: column;
						align-items: flex-start;
						justify-content: center;
						padding: 10px;
						gap: 5px;
						border: 1px solid $bordercolor;
						border-radius: $radius;
						overflow-y: auto;
						min-height: 28vh;
						max-height: 28vh;
						background-color: $darker;
					}
				}
			}

			.modal-overlay {
				position: fixed;
				top: 0;
				left: 0;
				width: 100%;
				height: 100%;
				background: rgba(0, 0, 0, 0.4);
				backdrop-filter: blur(2px);
				display: flex;
				justify-content: center;
				align-items: center;
			}

			.modal-content {
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				width: 80%;
				background: $bgcolor;
				padding: 20px;
				border-radius: 20px;
				border: 1px solid $color2;
			}
		}
	}

	/* Estilos da Lista de Peças e OS */
	.part-list,
	.form-base {
		background-color: $bgcolorl;
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
		grid-template-rows: 40px 1fr;
		gap: 10px;
		background-color: $bgcolorl;
		height: 100%;
		border-radius: 10px;
		border: 1px solid $bordercolor;
		padding: 10px;

		h2 {
			text-align: center;
			color: $maintextcolor;
		}

		.os-container {
			display: grid;
			grid-template-rows: 1fr 50px 200px;

			.reorderable-container {
				overflow-y: scroll;
				width: 100%;
				max-height: calc(35vh);
			}

			.total-container {
				display: flex;
				justify-content: flex-end;
				align-items: center;
				padding: 0 10px;
				font-size: 1.5rem;
				font-weight: bold;
				color: $maintextcolor;
			}

			.item {
				button {
					width: 24%;
					// font-size: 30pt;
					padding: 5px;
				}
			}
		}
	}

	#form-pag,
	#pag-x {
		background-color: $bgcolor;
		height: 30px;
		color: $maintextcolor;
		margin-bottom: 10px;
	}

	#form-pag {
		width: 78.5%;
	}

	#pag-x {
		width: 20%;
	}

	#clients,
	#cars,
	#parts {
		width: 100%;
		height: 100%;
	}

	textarea {
		background-color: $bgcolor;
		color: $maintextcolor;
		border: 1px solid $bordercolor;
		border-radius: 5px;
		padding: 10px;
		width: 100%;
		resize: none;
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
		background-color: $color;
		color: #ffffff;
		border: 1px solid #555;
		padding: 10px 20px;
		border-radius: 5px;
		cursor: pointer;
		&:hover {
			background-color: $color2;
		}
	}

	.add-part:hover {
		background-color: #444;
	}

	.active-border {
		border: 1px solid $color2;
	}

	.text {
		padding: 0 5px 0 10px;
		border-radius: 5px;
		font-size: 1.5rem;
		font-weight: bold;
		background-color: $bgcolor;
		width: 15px;
	}
</style>
