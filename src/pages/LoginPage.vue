<template>
  <div class="login-page">
    <div class="login-wrapper">
      <!-- CARD GLASS -->
      <div class="login-card">
        <div class="login-header">
          <div class="login-logo">
            <img src="../assets/logo_vinh.png" alt="logo bệnh viện" class="logo-img" />
          </div>
          <div class="login-title">
            <h3>Bệnh viện Đa khoa Thành phố Vinh</h3>
            <p>Hệ thống quản lý & gửi thông báo</p>
          </div>
        </div>

        <h2 class="login-heading">Đăng nhập</h2>

        <form class="login-form" @submit.prevent="doLogin">
          <!-- USERNAME -->
          <label class="login-label" for="username">Tên đăng nhập</label>
          <div class="login-input">
            <InputText id="username" v-model="userName" type="text" placeholder="Nhập tên đăng nhập" />
          </div>

          <!-- PASSWORD -->
          <label class="login-label" for="password">Mật khẩu</label>
          <div class="login-input">
            <InputText id="password" v-model="password" type="password" placeholder="Nhập mật khẩu"
              @keyup.enter="doLogin" />
          </div>

          <div class="login-extra">
            <a href="javascript:void(0)">Quên mật khẩu?</a>
          </div>

          <!-- NÚT ĐĂNG NHẬP -->
          <Button class="login-btn" label="Đăng nhập" icon="pi pi-sign-in" iconPos="left" :disabled="!valid"
            @click="doLogin" />


          <p class="login-footer-text">
            Đăng nhập bằng tài khoản nội bộ của bệnh viện.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { Login } from '../models/login'
import AuthRepository from '../services/AuthRepository'

export default {
  setup() {
    const router = useRouter()
    const store = useStore()
    const toast = useToast()

    const login = ref({} as Login)
    const userName = ref('')
    const password = ref('')

    const valid = computed(() => !!password.value && !!userName.value)

    const doLogin = () => {
      console.log('############################## loginpage')
      const md5 = require('md5')

      login.value.username = userName.value
      login.value.password = md5(password.value)

      console.log(
        '############################## login request: ',
        JSON.stringify(login.value)
      )

      AuthRepository.auth(login.value)
        .then((response: any) => {
          console.log('auth response: ', response.data)

          const token = response?.data?.token

          //  không có token => ĐĂNG NHẬP THẤT BẠI
          if (!token) {
            toast.add({
              severity: 'error',
              summary: 'Đăng nhập',
              detail: 'Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại.',
              life: 1500
            })
            return
          }

          //  Có token => lưu vào store
          store.dispatch('setToken', token)

          // Lấy quyền (permission) – nếu lỗi vẫn cho vào, chỉ báo lỗi
          return AuthRepository.userPermission(login.value)
            .then((res: any) => {
              console.log('permission response: ', res.data)
              if (res?.data?.permission) {
                store.dispatch('setPermission', res.data.permission)
              }
            })
            .catch((err: any) => {
              console.error('userPermission error: ', err)
              toast.add({
                severity: 'warn',
                summary: 'Đăng nhập',
                detail: 'Không lấy được quyền người dùng, vui lòng thử lại sau.',
                life: 1500
              })
            })
            .then(() => {
              // login OK
              toast.add({
                severity: 'success',
                summary: 'Đăng nhập',
                detail: 'Đăng nhập thành công vào hệ thống',
                life: 1000
              })

              router.push({
                name: 'home'
              })
            })
        })
        .catch((error: any) => {
          console.error('auth error: ', error)
          toast.add({
            severity: 'error',
            summary: 'Đăng nhập',
            detail:
              'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập',
            life: 1500
          })
        })
    }

    return {
      login,
      doLogin,
      valid,
      password,
      userName
    }
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  width: 100%;
  background: radial-gradient(circle at top left, #06b649, #01863b);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  box-sizing: border-box;
}

.login-wrapper {
  width: 100%;
  max-width: 1200px;
  height: 90vh;
  border-radius: 32px;
  background-image: url('../assets/login-2.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}


/* CARD GLASS */
.login-card {
  width: 100%;
  max-width: 430px;
  padding: 36px 40px 30px;
  border-radius: 32px;
  background: rgba(0, 0, 0, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  color: #ffffff;
}

/* HEADER LOGO + TEXT */
.login-header {
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.login-logo {
  width: 52px;
  height: 52px;
  border-radius: 30px;
  background-color: #ffffff;
  margin-left: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.login-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.login-title p {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

/* HEADING */
.login-heading {
  margin: 18px 0 20px;
  font-size: 24px;
}

/* FORM */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.login-label {
  font-size: 13px;
  margin-top: 4px;
}

/* InputText – dùng :deep để override PrimeVue */
.login-input {
  margin-bottom: 4px;
}

.login-input :deep(.p-inputtext) {
  width: 100%;
  border-radius: 10px;
  border: none;
  padding: 10px 12px;
  font-size: 13px;
  background: #ffffff;
  color: #1c2833;
  box-shadow: 0 0 0 1px rgba(6, 182, 73, 0.35) inset;
}

.login-input :deep(.p-inputtext::placeholder) {
  color: #9ca3af;
}

.login-input :deep(.p-inputtext:focus) {
  outline: none;
  box-shadow: 0 0 0 2px #06b649 inset;
}

.login-extra {
  display: flex;
  justify-content: flex-end;
  margin: 2px 0 8px;
  font-size: 12px;
}

.login-extra a {
  color: #e9fdf2;
  text-decoration: none;
}

.login-extra a:hover {
  text-decoration: underline;
}

/* NÚT ĐĂNG NHẬP – override PrimeVue Button */
.login-btn {
  width: 100%;
  margin-top: 4px;
}

:deep(.p-button.login-btn) {
  background: #06b649 !important;
  border-color: #06b649 !important;
  color: #fff !important;
}

/* hover */
:deep(.p-button.login-btn:hover:not(.p-disabled)) {
  background: #049d3e !important;
  border-color: #049d3e !important;
}

/* focus */
:deep(.p-button.login-btn:focus) {
  box-shadow: 0 0 0 0.2rem rgba(6, 182, 73, 0.35) !important;
}



/* FOOTER TEXT */
.login-footer-text {
  margin-top: 10px;
  text-align: center;
  font-size: 11px;
  color: #eafcf1;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .login-wrapper {
    height: auto;
    border-radius: 0;
    box-shadow: none;
  }

  .login-card {
    max-width: 100%;
    border-radius: 24px;
    padding: 24px 18px 20px;
  }
}
</style>
