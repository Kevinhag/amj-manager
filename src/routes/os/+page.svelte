<script>
	import { onMount } from 'svelte';
	import Reorderable from '$lib/Reorderable.svelte';
	// import html2canvas from 'html2canvas';
	// import jsPDF from 'jspdf';


	let parts = [];
	let cars = [];
	let clients = [];

	let mainInfo = 'Gerar Ordem de Serviço';

	let addedParts = [];

	let selectedPart = '';
	let selectedPartData = '';

	let selectedCar = '';
	let selectedCarData = '';

	let selectedClient;
	let selectedClientData;

	let searchQuery = '';
	let searchPartQuery = '';


	function exportData() {
				const data = {
					selectedCarData,
					selectedClientData,
					addedParts,
				};

				// Convert the data to a JSON string
				const jsonData = JSON.stringify(data);

				// Create a new anchor element
				const anchor = document.createElement('a');

				// Set the anchor's href attribute to a data URL containing the JSON data
				anchor.href = `data:text/json;charset=utf-8,${encodeURIComponent(jsonData)}`;

				// Set the anchor's download attribute to specify the filename
				anchor.download = 'data.json';

				// Programmatically click the anchor to trigger the download
				anchor.click();

				// Export the data to PDF
				html2canvas(document.body).then((canvas) => {
					const imgData = canvas.toDataURL('image/png');
					const pdf = new jsPDF();
					pdf.addImage(imgData, 'PNG', 0, 0);
					pdf.save('data.pdf');
				});
			}

	onMount(() => {
		fetch('http://localhost:3000/api/cars')
			.then((response) => response.json())
			.then((data) => {
				cars = data;
				console.log(data);
			});

		fetch('http://localhost:3000/api/parts')
			.then((response) => response.json())
			.then((data) => {
				parts = data;
				console.log(data);
			});

		fetch('http://localhost:3000/api/clients')
			.then((response) => response.json())
			.then((data) => {
				clients = data;
				console.log(data);
			});
	});

	function addPartList() {
		addedParts.push(selectedPart);
		console.log(addedParts);
		addedParts = addedParts;
	}

	function handleClientSearch(event) {
		searchQuery = event.target.value.toLowerCase();
	}

	function handlePartSearch(event) {
		searchPartQuery = event.target.value.toLowerCase();
	}

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
</script>

<main>
	<h1>{mainInfo}</h1>
	<section>
		<div>
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
						Nome: {selectedClientData.nome}
						<br />
						CPF: {selectedClientData.cpf}
						<br />
						Telefone: {selectedClientData.tel}
						<br />
						Cidade: {selectedClientData.cidade}
						<br />
					{:else}
						<h3>Nenhum Cliente Selecionado.</h3>
					{/if}
				</div>
			</div>
		</div>
		<div>
			<div class="form-base">
				<h2>Carros:</h2>
				<select name="cars" id="cars" size="2" bind:value={selectedCar}>
					{#each cars.filter((car) => car.cliente_id == selectedClient) as car (car.id)}
						<option value={car.id}>
							{car.marca +
								'\xa0'.repeat(15 - car.marca.length) +
								'\xa0'.repeat(5) +
								car.modelo +
								'\xa0'.repeat(15 - car.modelo.length) +
								car.placa +
								'\xa0'.repeat(15 - car.marca.length)}
						</option>
					{/each}
				</select>
				<div class="form-details">
					{#if selectedCarData}
						Marca: {selectedCarData.marca}
						<br />
						Modelo: {selectedCarData.modelo}
						<br />
						Ano: {selectedCarData.ano}
						<br />
						Placa: {selectedCarData.placa}
						<br />
						{#if selectedCarData.obsretifica}
							<p>Observação: {selectedCarData.observacao}</p>
						{/if}
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
							{part.marca}&nbsp;&nbsp; - &nbsp;&nbsp;{part.nome}
						</option>
					{/each}
				</select>
				<button class="add-part" on:click={addPartList}>Adicionar Peça</button>
			</div>
		</div>
		<div>
			<div class="form-base">
				<h2>Ordem de Serviço:</h2>

				<!-- {#if selectedPartData}
					<p>{selectedPartData.marca}</p>
					<p>{selectedPartData.nome}</p>
					<p>{selectedPartData.valor}</p>
				{/if} -->
				<Reorderable
					bind:list={addedParts}
					update={(value) => {
						addedParts = value;
						console.log(value);
					}}
				/>
				<button on:click={exportData}>Gerar OS</button>
				<!-- {#if addedParts}
					<h3>Peças adicionadas</h3>
					{#each addedParts as part}
						<p>{part}</p>
					{/each}
				{/if} -->
			</div>
		</div>
	</section>
</main>

<style lang="scss">
	section {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		grid-template-rows: 1fr 1fr;
		gap: 1rem;
		width: 100%;
		height: 100%;
		// background-color: $colora;
	}

	.text {
		padding: 0px 5px 0px 10px;
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
	.form-car {
		background-color: $darker;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		border: 1px solid $color;
		gap: 10px;
		height: 150px;
	}

	.form-base {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
	}

	#clients {
		width: 100%;
		height: 100%;
	}

	#cars {
		width: 100%;
		height: 62px;
	}
</style>
