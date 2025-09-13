import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 路由懒加载
const Login = () => import('@/views/auth/LoginView.vue')
const Register = () => import('@/views/auth/RegisterView.vue')
const Home = () => import('@/views/home/HomeView.vue')
const ProjectDetail = () => import('@/views/project/ProjectDetailView.vue')
const CreateProject = () => import('@/views/project/CreateProjectView.vue')
const Conversation = () => import('@/views/conversation/ConversationView.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { requiresGuest: true }
    },
    {
      path: '/register',
      name: 'Register', 
      component: Register,
      meta: { requiresGuest: true }
    },
    {
      path: '/home',
      name: 'Home',
      component: Home,
      meta: { requiresAuth: true }
    },
    {
      path: '/project/create',
      name: 'CreateProject',
      component: CreateProject,
      meta: { requiresAuth: true }
    },
    {
      path: '/project/:id',
      name: 'ProjectDetail',
      component: ProjectDetail,
      meta: { requiresAuth: true },
      props: true
    },
    {
      path: '/project/:projectId/conversation/:conversationId?',
      name: 'Conversation',
      component: Conversation,
      meta: { requiresAuth: true },
      props: true
    },
    {
      path: '/project/:id/requirement-splitting',
      name: 'RequirementSplitting',
      component: () => import('@/views/project/RequirementSplittingView.vue'),
      meta: { requiresAuth: true },
      props: true
    },
    {
      path: '/project/:id/results',
      name: 'RequirementSplittingResults',
      component: () => import('@/views/project/RequirementSplittingResultsView.vue'),
      meta: { requiresAuth: true },
      props: true
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/home'
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 初始化认证状态
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }
  
  const isAuthenticated = authStore.isAuthenticated
  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest
  
  if (requiresAuth && !isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next('/login')
  } else if (requiresGuest && isAuthenticated) {
    // 已登录用户访问登录/注册页，跳转到首页
    next('/home')
  } else {
    next()
  }
})

export default router