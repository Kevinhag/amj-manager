<script>
	import { onMount } from 'svelte';
	import Notification from '$lib/components/Notification.svelte';
	import ListItem from '$lib/components/ListItem.svelte';
	import { page } from '$app/stores';

	// Dados carregados via API
	let clients = [];
	let cars = [];

	// Variáveis para gerenciar o cliente
	let selectedClient = '';
	let selectedClientData = null;
	let clientSearch = '';

	// Objeto para dados editáveis do cliente
	let clientForm = {
		nome: '',
		cpf: '',
		endereco: '',
		bairro: '',
		cidade: '',
		numero_casa: '',
		complemento: '',
		tel: '',
		tel2: ''
	};

	// Variáveis para gerenciar os carros
	let selectedCar = '';
	let selectedCarData = null;

	// Objeto para dados editáveis do carro
	let carForm = {
		marca: '',
		modelo: '',
		placa: '',
		ano: '',
		km: '',
		potencia: '',
		observacao: '',
		obsretifica: ''
	};

	let notificationMessage = '';
	let notificationType = '';

	// Variáveis para detectar mudanças de seleção (para não sobrescrever o que o usuário editou)
	let prevSelectedClient = null;
	let prevSelectedCar = null;

	// Busca os dados de clientes e carros ao montar a página
	onMount(() => {
		const params = $page.url.searchParams;
		selectedClient = params.get('clientId') || '';
		selectedCar = params.get('carId') || '';
		fetchData();
	});

	async function fetchData() {
		try {
			const [clientResponse, carResponse] = await Promise.all([
				fetch('http://localhost:3000/api/clients'),
				fetch('http://localhost:3000/api/cars'),
			]);

			if (!clientResponse.ok || !carResponse.ok) {
				throw new Error('Falha ao buscar dados');
			}

			clients = await clientResponse.json();
			cars = await carResponse.json();
		} catch (error) {
			showNotification('Erro ao buscar dados: ' + error.message, 'error');
		}
	}

	// Atualiza o cliente selecionado a partir dos dados carregados
	$: selectedClientData = clients.find((client) => client.id == selectedClient);

	// Quando um novo cliente for selecionado, copia os dados para o objeto de formulário
	$: if (selectedClient && selectedClient !== prevSelectedClient) {
		if (selectedClientData) {
			clientForm = { ...selectedClientData };
			prevSelectedClient = selectedClient;
		}
	}

	// Filtra os clientes conforme o termo de busca
	$: filteredClients = clients.filter((client) => {
		const search = (clientSearch || '').toLowerCase();
		return (
			(client.nome || '').toLowerCase().includes(search) ||
			(client.cpf || '').toLowerCase().includes(search) ||
			(client.tel || '').toLowerCase().includes(search) ||
			(client.tel2 || '').toLowerCase().includes(search)
		);
	});

	// Filtra os carros do cliente selecionado
	$: filteredCars = selectedClient ? cars.filter((car) => car.cliente_id == selectedClient) : [];

	// Atualiza o carro selecionado a partir dos dados carregados
	$: selectedCarData = filteredCars.find((car) => car.id == selectedCar);

	// Quando um novo carro for selecionado, copia os dados para o objeto de formulário do carro
	$: if (selectedCar && selectedCar !== prevSelectedCar) {
		if (selectedCarData) {
			carForm = { ...selectedCarData };
			prevSelectedCar = selectedCar;
		}
	}

	// Funções de Cliente
	async function addClient() {
		try {
			const response = await fetch('http://localhost:3000/api/insert-client', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(clientForm),
			});
			await response.json();
			showNotification('Cliente adicionado com sucesso!', 'success');
			fetchData();
			clearClientForm();
		} catch (error) {
			showNotification('Erro ao adicionar cliente: ' + error.message, 'error');
		}
	}

	async function updateClient() {
		if (!selectedClientData) {
			showNotification('Selecione um cliente para atualizar', 'error');
			return;
		}
		const updatedClient = {
			id: selectedClientData.id,
			...clientForm
		};
		try {
			const response = await fetch('http://localhost:3000/api/update-client', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedClient),
			});
			await response.json();
			showNotification('Cliente atualizado com sucesso!', 'success');
			fetchData();
		} catch (error) {
			showNotification('Erro ao atualizar cliente: ' + error.message, 'error');
		}
	}

	async function deleteClient() {
		if (!selectedClientData) {
			showNotification('Selecione um cliente para deletar', 'error');
			return;
		}
		try {
			const response = await fetch(
				`http://localhost:3000/api/delete-client/${selectedClientData.id}`,
				{
					method: 'DELETE',
				}
			);
			await response.json();
			showNotification('Cliente deletado com sucesso!', 'success');
			fetchData();
			clearClientForm();
		} catch (error) {
			showNotification('Erro ao deletar cliente: ' + error.message, 'error');
		}
	}

	function clearClientForm() {
		clientForm = {
			nome: '',
			cpf: '',
			endereco: '',
			bairro: '',
			cidade: '',
			numero_casa: '',
			complemento: '',
			tel: '',
			tel2: ''
		};
		selectedClient = '';
		selectedClientData = null;
		prevSelectedClient = null;
	}

	// Funções de Carro
	async function addCar() {
		if (!selectedClient) {
			showNotification('Selecione um cliente para adicionar um carro', 'error');
			return;
		}
		try {
			const response = await fetch('http://localhost:3000/api/insert-car', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cliente_id: selectedClient, ...carForm }),
			});
			await response.json();
			showNotification('Carro adicionado com sucesso!', 'success');
			fetchData();
			clearCarForm();
		} catch (error) {
			showNotification('Erro ao adicionar carro: ' + error.message, 'error');
		}
	}

	async function updateCar() {
		if (!selectedCarData) {
			showNotification('Selecione um carro para atualizar', 'error');
			return;
		}
		const updatedCar = {
			id: selectedCarData.id,
			cliente_id: selectedClient,
			...carForm
		};
		try {
			const response = await fetch('http://localhost:3000/api/update-car', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updatedCar),
			});
			await response.json();
			showNotification('Carro atualizado com sucesso!', 'success');
			fetchData();
		} catch (error) {
			showNotification('Erro ao atualizar carro: ' + error.message, 'error');
		}
	}

	async function deleteCar() {
		if (!selectedCarData) {
			showNotification('Selecione um carro para deletar', 'error');
			return;
		}
		try {
			const response = await fetch(
				`http://localhost:3000/api/delete-car/${selectedCarData.id}`,
				{
					method: 'DELETE',
				}
			);
			await response.json();
			showNotification('Carro deletado com sucesso!', 'success');
			fetchData();
			clearCarForm();
		} catch (error) {
			showNotification('Erro ao deletar carro: ' + error.message, 'error');
		}
	}

	function clearCarForm() {
		carForm = {
			marca: '',
			modelo: '',
			placa: '',
			ano: '',
			km: '',
			potencia: '',
			observacao: '',
			obsretifica: ''
		};
		selectedCar = '';
		selectedCarData = null;
		prevSelectedCar = null;
	}

	function showNotification(message, type) {
		notificationMessage = message;
		notificationType = type;
		setTimeout(() => {
			notificationMessage = '';
		}, 3000);
	}
</script>

<section class="form-main">
	<!-- Clientes -->
	<div class="form-clients">
		<h2>Clientes:</h2>
		<input
			type="text"
			class="client-search"
			placeholder="Buscar cliente..."
			bind:value={clientSearch}
		/>
		<div class="client-list">
			{#each filteredClients as client, i}
				<ListItem
					datatype="client"
					index={i}
					display={[client.nome.toUpperCase(), client.cpf.toUpperCase()]}
					toggled={client.id == selectedClient}
					onselect={() => (selectedClient = client.id)}
				/>
			{/each}
		</div>

		<div class="form-row">
			<div>
				<label for="">Nome:</label>
				<input type="text" bind:value={clientForm.nome} />
			</div>
			<div>
				<label for="">CPF:</label>
				<input type="text" bind:value={clientForm.cpf} />
			</div>
			<div>
				<label for="">Telefone:</label>
				<input type="text" bind:value={clientForm.tel} />
			</div>
			<div>
				<label for="">Telefone 2:</label>
				<input type="text" bind:value={clientForm.tel2} />
			</div>
			<div>
				<label for="">Endereço:</label>
				<input type="text" bind:value={clientForm.endereco} />
			</div>
			<div>
				<label for="">Número:</label>
				<input type="text" bind:value={clientForm.numero_casa} />
			</div>
			<div>
				<label for="">Complemento:</label>
				<input type="text" bind:value={clientForm.complemento} />
			</div>
			<div>
				<label for="">Bairro:</label>
				<input type="text" bind:value={clientForm.bairro} />
			</div>
			<div>
				<label for="">Cidade:</label>
				<input type="text" bind:value={clientForm.cidade} />
			</div>
		</div>

		<div class="buttons">
			{#if selectedClient}
				<button disabled>Adicionar Cliente</button>
				<button on:click={updateClient}>Atualizar Cliente</button>
				<button on:click={deleteClient}>Excluir Cliente</button>
				<button on:click={clearClientForm}>Novo Cliente</button>
			{:else}
				<button on:click={addClient}>Adicionar Cliente</button>
				<button disabled>Atualizar Cliente</button>
				<button disabled>Excluir Cliente</button>
				<button disabled>Novo Cliente</button>
			{/if}
		</div>
	</div>

	<!-- Seção de Carros -->
	<div class="form-cars">
		<h2>
			{selectedClientData ? 'Carros de ' + selectedClientData.nome.toUpperCase() : ''}
		</h2>
		{#if selectedClient}
			<div class="cars-list">
				{#each filteredCars as car, i}
					<ListItem
						datatype="car"
						index={i}
						display={[car.modelo.toUpperCase(), car.placa.toUpperCase()]}
						toggled={car.id == selectedCar}
						onselect={() => (selectedCar = car.id)}
					/>
				{/each}
			</div>
			<div class="form-row">
				<div>
					<label for="">Marca:</label>
					<input type="text" bind:value={carForm.marca} />
				</div>
				<div>
					<label for="">Modelo:</label>
					<input type="text" bind:value={carForm.modelo} />
				</div>
				<div>
					<label for="">Placa:</label>
					<input type="text" bind:value={carForm.placa} />
				</div>
				<div>
					<label for="">Ano:</label>
					<input type="text" bind:value={carForm.ano} />
				</div>
				<div>
					<label for="">KM:</label>
					<input type="text" bind:value={carForm.km} />
				</div>
				<div>
					<label for="">Potência:</label>
					<input type="text" bind:value={carForm.potencia} />
				</div>
				<div>
					<label for="">Observação:</label>
					<input type="text" bind:value={carForm.observacao} />
				</div>
				<div>
					<label for="">Obs. Retífica:</label>
					<input type="text" bind:value={carForm.obsretifica} />
				</div>
			</div>
			<div class="buttons">
				{#if selectedCar}
					<button disabled>Adicionar Carro</button>
					<button on:click={updateCar}>Atualizar Carro</button>
					<button on:click={deleteCar}>Excluir Carro</button>
					<button on:click={clearCarForm}>Novo Carro</button>
				{:else}
					<button on:click={addCar}>Adicionar Carro</button>
					<button disabled>Atualizar Carro</button>
					<button disabled>Excluir Carro</button>
					<button disabled>Novo Carro</button>
				{/if}
			</div>
		{:else}
			<p>Selecione um cliente para gerenciar seus carros</p>
		{/if}
	</div>
</section>

{#if notificationMessage}
	<Notification message={notificationMessage} type={notificationType} />
{/if}


<style lang="scss">
	@import 'src/lib/styles/select.scss';
	@import 'src/lib/styles/buttons.scss';
	@import 'src/lib/styles/mixins.scss';

	.form-main {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		width: 100%;
		height: 100%;
		background-color: $bgcolor;
		border-radius: $radius;

		.form-clients {
			@include container-base;
			display: grid;
			grid-template-rows: max-content max-content auto max-content max-content;
			overflow-y: hidden;
			gap: 0.5rem;

			h2 {
				text-align: center;
			}

			.client-search {
				@include form-input;
			}

			.client-list {
				overflow-y: auto;
				background-color: $darker;
				border: 1px solid $bordercolor;
				border-radius: $radius;
			}

			.form-row {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 0.5rem;

				@media (max-width: 768px) {
					grid-template-columns: 1fr;
				}

				label {
					font-weight: bold;
					font-size: 0.8rem;
				}

				input {
					@include form-input;
				}
			}
		}
		.form-cars {
			@include container-base;
			display: grid;
			grid-template-rows: max-content auto max-content max-content;
			gap: 0.5rem;

			h2 {
				text-align: center;
			}

			p {
				text-align: center;
				font-size: 1.2rem;
				font-weight: bold;
				color: $maintextcolor;
			}

			.cars-list {
				border-radius: $radius;
				border: 1px solid $bordercolor;
				height: 100%;
				overflow-y: auto;
			}

			.form-row {
				display: grid;
				grid-template-columns: 1fr 1fr;
				gap: 0.5rem;

				@media (max-width: 768px) {
					grid-template-columns: 1fr;
				}

				label {
					font-weight: bold;
					font-size: 0.8rem;
				}

				input {
					@include form-input;
				}
			}
		}
	}

	.buttons {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;

		button {
			@include button-base;
			width: 25%;

			&:disabled {
				@include button-disabled;
			}
		}
	}
</style>
