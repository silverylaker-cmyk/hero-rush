import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/deployment',timeout:180000,workers:1,reporter:'list',use:{baseURL:'https://silverylaker-cmyk.github.io/hero-rush/',channel:process.env.CI?undefined:'chrome',headless:true,viewport:{width:1280,height:720}}});
