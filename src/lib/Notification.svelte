<!-- src/lib/components/Notification.svelte -->
<script>
	export let message = '';
	export let type = 'success'; // Pode ser 'success', 'error', 'info', etc.
	let isVisible = true;

	function close() {
		isVisible = false;
	}
</script>

{#if isVisible}
	<div class="notification {type}">
		{message}
		<span class="close" on:click={close}>✖</span>
	</div>
{/if}

<style lang="scss">
	.notification {
		position: absolute;
		top: 50px;
		right: 20px;
		padding: 10px;
		border-radius: 8px;
		color: $maintextcolor;
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
	.close {
		cursor: pointer;
		margin-left: 10px;
	}
</style>
