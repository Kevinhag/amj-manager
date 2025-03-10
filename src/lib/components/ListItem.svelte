<script>
	export let datatype = 'string';
	export let toggled = false;
	// export let data = {};
	export let display = ['empty'];
	export let onselect = () => {};
	export let index = -1;
	export let onadd = () => {};
</script>

<button class:selected={toggled} class:odd={index % 2 > 0} on:click={onselect} on:dblclick={onadd}>
	{#if datatype == 'client'}
		<div class="content-client">
			{#each display as item}
				<div>{item}</div>
			{/each}
		</div>
	{/if}
	{#if datatype == 'os'}
		<div class="content-os">
			{#each display as item}
				<div>{item}</div>
			{/each}
		</div>
	{/if}
	{#if datatype == 'part'}
		<div class="content-part">
			{#each display as item}
				<div>{item}</div>
			{/each}
		</div>
	{/if}
	{#if datatype == 'car'}
		<div class="content-car">
			{#each display as item}
				<div>{item}</div>
			{/each}
		</div>
	{/if}
</button>

<style lang="scss">
	@import 'src/lib/styles/variables.scss';

	button {
		font-size: 15px;
		background-color: $bgcolor;
		color: $maintextcolor;
		border: 1px solid transparent;
		padding: 0 10px;
		width: 100%;
		height: 30px;
		font-weight: bold;
		cursor: pointer;

		&.odd {
			background-color: $lighter;

			&:hover {
				background-color: $darkerhover;
				border: 1px solid $color2;
			}
		}

		&.selected {
			border: 1px solid $color2;
			background-color: $color2a;

			&:hover {
				background-color: $darkerhover;
				border: 1px solid $color2;
			}
		}

		&:hover {
			background-color: $darkerhover;
			border: 1px solid $color2;
			color: $color2;
		}

		.content-client {
			display: grid;
			grid-template-columns: 1fr 1fr auto;
			text-decoration: none;
			user-select: none !important;
			height: 100%;
			align-items: center;
			justify-items: start;
			text-wrap: nowrap;
		}

		.content-os {
			gap: $gap;
			align-items: center;
			justify-items: center;
		}

		.content-part {
			display: grid;
			grid-template-columns: 0.5fr 1fr;
			text-decoration: none;
			user-select: none !important;
			height: 100%;
			align-items: center;
			justify-items: start;
			text-wrap: nowrap;
		}

		.content-car {
			display: grid;
			grid-template-columns: 1fr 1fr;
			align-items: center;
			justify-items: start;
			height: 100%;
			text-wrap: nowrap;
		}

		.content-os {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr 1fr; 
			align-items: center;
			justify-items: start;
			height: 100%;
			text-wrap: nowrap;
		}
	}
</style>
