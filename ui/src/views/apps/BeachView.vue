<template>
    <div class="beach-root">

        <!-- Sky and Sea Scene Base -->
        <div class="scene">
            <!-- Decor: Sun -->
            <div class="sun"></div>
            <!-- Decor: Cloud -->
            <div class="cloud cloud-1"></div>
            <div class="cloud cloud-2"></div>
            <div class="cloud cloud-3"></div>

            <!-- Ocean & Waves -->
            <div class="ocean">
                <div class="wave wave-back"></div>
                <div class="wave wave-front"></div>
            </div>

            <!-- Sand Beach -->
            <div class="sand">
                <div class="shell"></div>
                <div class="starfish"></div>
            </div>
        </div>

        <!-- UI Overlay Base -->
        <div class="ui-layer">
            <!-- Title -->
            <div class="header">
                <h1 class="font-bold text-2xl text-white drop-shadow-md">🏖️ 沙滩散步</h1>
                <p class="text-white/80 text-sm mt-1 drop-shadow-sm font-semibold tracking-wide">阳光、海浪与你</p>
            </div>

            <!-- AI Reaction Box (Like Poker's) -->
            <div v-if="aiResponse || aiReaction" class="reaction-box">
                <div class="reaction-avatar">AI</div>
                <div class="reaction-content">
                    <span class="reaction-text">{{ aiResponse }}</span>
                    <span v-if="aiReaction" class="reaction-badge">{{ aiReaction }}</span>
                </div>
            </div>
            <div v-else class="reaction-box empty-hint">
                还没有互动记录，点击下方动作开始吧！
            </div>

            <!-- Error Message -->
            <div v-if="errorMsg"
                class="error-msg text-red-500 font-bold bg-white/80 px-4 py-2 rounded-lg mt-4 shadow-sm text-sm">
                {{ errorMsg }}
            </div>

            <!-- Action Buttons -->
            <div class="actions">
                <!-- Interactive Panel -->
                <button @click="interact('散步')" :disabled="loading" class="btn-action bg-blue-400">
                    👟 散步
                </button>
                <button @click="interact('倾听')" :disabled="loading" class="btn-action bg-teal-400">
                    👂 倾听
                </button>
                <button @click="interact('划船')" :disabled="loading" class="btn-action bg-cyan-500">
                    🛶 划船
                </button>
                <button @click="interact('送椰子')" :disabled="loading" class="btn-action bg-green-500">
                    🥥 送椰子
                </button>
                <button @click="interact('捡贝壳')" :disabled="loading" class="btn-action bg-yellow-400 text-yellow-900">
                    🐚 捡贝壳
                </button>
            </div>

            <!-- Loading overlay for buttons -->
            <div v-if="loading" class="interacting-float">
                互动中...
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
const loading = ref(false);
const errorMsg = ref('');
const aiResponse = ref('');
const aiReaction = ref('');

const interact = async (action) => {
    if (loading.value) return;

    loading.value = true;
    errorMsg.value = '';

    try {
        const res = await fetch('/apps/beach/interact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        const data = await res.json();

        if (data.success) {
            aiResponse.value = data.item.aiResponse;
            aiReaction.value = data.item.aiReaction;
        } else {
            errorMsg.value = data.message || '互动失败，请重试';
        }
    } catch (err) {
        errorMsg.value = '网络出错了，海风没吹到~';
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.beach-root {
    position: relative;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background: linear-gradient(180deg, #74ebd5 0%, #9face6 100%);
    font-family: 'PingFang SC', 'Helvetica Neue', sans-serif;
}

/* --- Environment --- */
.scene {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
}

.sun {
    position: absolute;
    top: 10%;
    right: 15%;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, #fff3a1 0%, #ffde00 50%, transparent 70%);
    border-radius: 50%;
    box-shadow: 0 0 50px #ffdb58;
    animation: floatSun 6s ease-in-out infinite alternate;
}

@keyframes floatSun {
    from {
        transform: translateY(0);
    }

    to {
        transform: translateY(-15px) scale(1.05);
    }
}

.cloud {
    position: absolute;
    background: white;
    border-radius: 50px;
    opacity: 0.8;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.cloud::before,
.cloud::after {
    content: '';
    position: absolute;
    background: white;
    border-radius: 50%;
}

.cloud-1 {
    top: 15%;
    left: 10%;
    width: 100px;
    height: 35px;
    animation: moveCloud 35s linear infinite;
}

.cloud-1::before {
    width: 50px;
    height: 50px;
    top: -25px;
    left: 15px;
}

.cloud-1::after {
    width: 40px;
    height: 40px;
    top: -15px;
    right: 15px;
}

.cloud-2 {
    top: 25%;
    left: 60%;
    width: 140px;
    height: 45px;
    animation: moveCloud 45s linear infinite;
}

.cloud-2::before {
    width: 70px;
    height: 70px;
    top: -35px;
    left: 20px;
}

.cloud-2::after {
    width: 55px;
    height: 55px;
    top: -25px;
    right: 20px;
}

.cloud-3 {
    top: 8%;
    left: 80%;
    width: 80px;
    height: 30px;
    animation: moveCloud 25s linear infinite;
}

.cloud-3::before {
    width: 40px;
    height: 40px;
    top: -20px;
    left: 10px;
}

.cloud-3::after {
    width: 30px;
    height: 30px;
    top: -10px;
    right: 10px;
}

@keyframes moveCloud {
    0% {
        transform: translateX(100vw);
    }

    100% {
        transform: translateX(-200px);
    }
}

.ocean {
    position: absolute;
    bottom: 20%;
    width: 100%;
    height: 40%;
    background: linear-gradient(180deg, #1ca5f2 0%, #2f80ed 100%);
    overflow: hidden;
}

.wave {
    position: absolute;
    bottom: 0;
    width: 200%;
    height: 60px;
    background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDEyMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTMyMS4zOSw1Ni40NEMyMjguNTksNzQuMjEsMTE0LjcsNjUuOTgsMCwyNXY5NWgxMjAwVjI1QzEwODUuMyw2NS45OCw5NzEuNDIsNzQuMjEsODc4LjYxLDU2LjQ0Yy05Mi44LTE3Ljc4LTE4Ny43LTQwLjY2LTI3OC41Mi0zMUM1MDkuMjksMzYuNjMsNDI0LjQxLDcxLjEyLDMyMS4zOSw1Ni40NHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4yKSI+PC9wYXRoPjwvc3ZnPg==') repeat-x;
    background-size: 50% 100%;
}

.wave-back {
    animation: wavePattern 8s linear infinite reverse;
    opacity: 0.5;
    bottom: 10px;
}

.wave-front {
    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDEyMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTMyMS4zOSw1Ni40NEMyMjguNTksNzQuMjEsMTE0LjcsNjUuOTgsMCwyNXY5NWgxMjAwVjI1QzEwODUuMyw2NS45OCw5NzEuNDIsNzQuMjEsODc4LjYxLDU2LjQ0Yy05Mi44LTE3Ljc4LTE4Ny43LTQwLjY2LTI3OC41Mi0zMUM1MDkuMjksMzYuNjMsNDI0LjQxLDcxLjEyLDMyMS4zOSw1Ni40NHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC40KSI+PC9wYXRoPjwvc3ZnPg==');
    animation: wavePattern 6s linear infinite;
    bottom: -5px;
}

@keyframes wavePattern {
    0% {
        background-position: 0 0;
    }

    100% {
        background-position: 1000px 0;
    }
}

.sand {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 25%;
    background: linear-gradient(180deg, #fceb9e 0%, #ecd07a 100%);
    box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.1);
}

.shell {
    position: absolute;
    top: 20%;
    left: 30%;
    width: 20px;
    height: 15px;
    background: #ffb6c1;
    border-radius: 50% 50% 0 0;
    box-shadow: inset 0 -2px rgba(0, 0, 0, 0.1);
    transform: rotate(-15deg);
}

.starfish {
    position: absolute;
    top: 40%;
    right: 20%;
    width: 25px;
    height: 25px;
    background: #ff7f50;
    clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    transform: rotate(20deg);
}


/* --- UI Layer --- */
.ui-layer {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
    padding: 40px 20px;
    box-sizing: border-box;
}

.header {
    text-align: center;
    margin-bottom: 30px;
}

.reaction-box {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    max-width: 500px;
    width: 100%;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1), inset 0 2px 5px rgba(255, 255, 255, 1);
    border: 1px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
    min-height: 120px;
}

.reaction-avatar {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 18px;
    flex-shrink: 0;
    box-shadow: 0 4px 10px rgba(56, 239, 125, 0.4);
}

.reaction-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex: 1;
}

.reaction-text {
    font-size: 16px;
    color: #3b4252;
    line-height: 1.6;
    font-weight: 500;
}

.reaction-badge {
    font-size: 11px;
    font-weight: bold;
    background: #ebf4ff;
    color: #3182ce;
    padding: 4px 10px;
    border-radius: 12px;
    letter-spacing: 0.1em;
    border: 1px solid #bee3f8;
}

.empty-hint {
    justify-content: center;
    align-items: center;
    color: #718096;
    font-size: 14px;
    font-weight: 500;
    text-align: center;
}

.actions {
    position: absolute;
    bottom: 8%;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    width: 100%;
    max-width: 600px;
    padding: 0 16px;
    box-sizing: border-box;
}

.btn-action {
    color: white;
    font-weight: bold;
    padding: 12px 20px;
    border-radius: 50px;
    font-size: 14px;
    letter-spacing: 0.05em;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    border: 2px solid rgba(255, 255, 255, 0.4);
    transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-action:hover:not(:disabled) {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.btn-action:active:not(:disabled) {
    transform: translateY(0) scale(0.95);
}

.btn-action:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    filter: grayscale(0.5);
}

.interacting-float {
    position: absolute;
    bottom: 3%;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    letter-spacing: 0.1em;
    animation: pulse 1s infinite alternate;
}

@keyframes pulse {
    from {
        opacity: 0.7;
    }

    to {
        opacity: 1;
    }
}

@media (max-width: 600px) {
    .actions {
        gap: 8px;
    }

    .btn-action {
        padding: 10px 16px;
        font-size: 13px;
    }

    .reaction-box {
        padding: 20px;
    }
}
</style>
