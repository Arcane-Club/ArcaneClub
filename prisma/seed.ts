import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Default Admin User
  const adminEmail = 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        username: 'Admin',
        role: 'ADMIN',
        emailVerified: new Date(),
        bio: 'System Administrator',
      },
    });
    console.log('Created admin user: admin@example.com / admin123');
  } else {
    console.log('Admin user already exists.');
  }

  // 2. Create Default System Settings
  const defaultSettings = [
    { key: 'site_config', value: JSON.stringify({ siteName: 'Arcane Club', siteDescription: 'A modern community for everyone.', siteLogo: '' }) },
    { key: 'smtp_config', value: JSON.stringify({ enabled: false, host: '', port: 587, user: '', pass: '', fromName: 'Arcane Club', fromEmail: '' }) },
    { key: 'captcha_config', value: JSON.stringify({ enabled: true, provider: 'slider', siteKey: '', secretKey: '' }) },
    { key: 'pages_config', value: JSON.stringify({ enabled: true, maxPagesPerUser: 1 }) },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('System settings seeded.');

  // 3. Create Default Categories and Boards
  const categories = [
    {
      name: '技术交流',
      slug: 'tech',
      sortOrder: 1,
      boards: [
        { name: '前端开发', slug: 'frontend', description: 'HTML, CSS, JS, React, Vue' },
        { name: '后端开发', slug: 'backend', description: 'Node.js, Python, Go, Java' },
      ],
    },
    {
      name: '生活闲谈',
      slug: 'life',
      sortOrder: 2,
      boards: [
        { name: '水楼', slug: 'water', description: '随便聊聊' },
        { name: '求职招聘', slug: 'jobs', description: '找工作，招人' },
      ],
    },
  ];

  for (const cat of categories) {
    const existingCategory = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          sortOrder: cat.sortOrder,
          boards: {
            create: cat.boards,
          },
        },
      });
      console.log(`Created category: ${cat.name}`);
    } else {
        // Ensure boards exist
        const existingCat = await prisma.category.findUnique({
            where: { slug: cat.slug },
            include: { boards: true }
        });
        
        if (existingCat) {
             for (const board of cat.boards) {
                const boardExists = existingCat.boards.some(b => b.slug === board.slug);
                if (!boardExists) {
                    await prisma.board.create({
                        data: {
                            name: board.name,
                            slug: board.slug,
                            description: board.description,
                            categoryId: existingCat.id
                        }
                    });
                    console.log(`Created board: ${board.name} in ${cat.name}`);
                }
             }
        }
    }
  }

  // 4. Create Default Navbar Items
  const navbarItems = [
    { label: '首页', url: '/', sortOrder: 0 },
    { label: '所有帖子', url: '/posts', sortOrder: 1 },
  ];

  for (const item of navbarItems) {
    // Check by url to avoid duplicates
    const existing = await prisma.navbarItem.findFirst({
        where: { url: item.url }
    });
    if (!existing) {
        await prisma.navbarItem.create({ data: item });
        console.log(`Created navbar item: ${item.label}`);
    }
  }

  // 5. Create Default Pages
  const pages = [
    {
      title: '关于我们',
      slug: 'about-us',
      content: '# 关于我们\n\n欢迎来到 Arcane Club！我们是一个专注于技术交流和生活分享的现代化社区。\n\n## 我们的使命\n\n连接每一位开发者和创作者。',
      published: true,
    },
    {
      title: '隐私政策',
      slug: 'privacy-policy',
      content: '# 隐私政策\n\n我们非常重视您的隐私。本隐私政策说明了我们如何收集、使用和保护您的个人信息。\n\n## 信息收集\n\n我们仅收集必要的注册信息。',
      published: true,
    },
  ];

  for (const page of pages) {
    const existing = await prisma.page.findUnique({
      where: { slug: page.slug },
    });
    if (!existing) {
      await prisma.page.create({ data: page });
      console.log(`Created page: ${page.title}`);
    }
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
