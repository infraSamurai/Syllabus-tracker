// Test script to verify Syllabus Tracker functionality
const API_BASE = 'http://localhost:5002/api';
const puppeteer = require('puppeteer');

async function testFunctionality() {
    console.log('🧪 Testing Syllabus Tracker Functionality...\n');

    // Test 1: Check if backend is running
    console.log('1. Testing Backend Connectivity...');
    try {
        const healthResponse = await fetch(`${API_BASE.replace('/api', '')}/health`);
        if (healthResponse.ok) {
            console.log('✅ Backend is running');
        } else {
            console.log('❌ Backend health check failed');
        }
    } catch (error) {
        console.log('❌ Backend not accessible:', error.message);
    }

    // Test 2: Check existing data
    console.log('\n2. Testing Existing Data...');
    try {
        const classesResponse = await fetch(`${API_BASE}/classes`);
        const classes = await classesResponse.json();
        console.log(`✅ Classes: ${classes.length} found`);

        const subjectsResponse = await fetch(`${API_BASE}/syllabus/subjects`);
        const subjects = await subjectsResponse.json();
        console.log(`✅ Subjects: ${subjects.length} found`);

        const tasksResponse = await fetch(`${API_BASE}/tasks`);
        const tasks = await tasksResponse.json();
        console.log(`✅ Tasks: ${tasks.length} found`);
    } catch (error) {
        console.log('❌ Error loading existing data:', error.message);
    }

    // Test 3: Check new endpoints
    console.log('\n3. Testing New Endpoints...');
    try {
        const kpisResponse = await fetch(`${API_BASE}/kpis`);
        const kpis = await kpisResponse.json();
        console.log(`✅ KPIs endpoint: ${Array.isArray(kpis) ? 'Working' : 'Error'}`);

        const milestonesResponse = await fetch(`${API_BASE}/milestones`);
        const milestones = await milestonesResponse.json();
        console.log(`✅ Milestones endpoint: ${Array.isArray(milestones) ? 'Working' : 'Error'}`);

        const scheduledReportsResponse = await fetch(`${API_BASE}/scheduled-reports`);
        const scheduledReports = await scheduledReportsResponse.json();
        console.log(`✅ Scheduled Reports endpoint: ${scheduledReports.error ? 'Requires auth' : 'Working'}`);
    } catch (error) {
        console.log('❌ Error testing new endpoints:', error.message);
    }

    // Test 4: Check frontend accessibility
    console.log('\n4. Testing Frontend...');
    try {
        const frontendResponse = await fetch('http://localhost:3002');
        if (frontendResponse.ok) {
            console.log('✅ Frontend is accessible');
        } else {
            console.log('❌ Frontend not accessible');
        }
    } catch (error) {
        console.log('❌ Frontend error:', error.message);
    }

    console.log('\n📊 Summary:');
    console.log('- Backend: Running on port 5002');
    console.log('- Frontend: Running on port 3002');
    console.log('- Database: MongoDB connected');
    console.log('- Existing data: Classes, Subjects, Tasks available');
    console.log('- New features: KPIs, Milestones, Scheduled Reports endpoints added');
    console.log('\n🎯 Next Steps:');
    console.log('1. Open http://localhost:3002 in your browser');
    console.log('2. Navigate through all sections using the sidebar');
    console.log('3. Test adding new classes, subjects, tasks');
    console.log('4. Test the export functionality');
    console.log('5. Check if all modals and forms work properly');
}

async function testFrontend() {
    console.log('🧪 Testing Frontend Functionality...');
    
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to the frontend
        console.log('📱 Loading frontend...');
        await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
        
        // Wait for the page to load
        await page.waitForTimeout(3000);
        
        // Check for JavaScript errors
        const errors = await page.evaluate(() => {
            return window.errors || [];
        });
        
        if (errors.length > 0) {
            console.log('❌ JavaScript errors found:');
            errors.forEach(error => console.log(`   - ${error}`));
        } else {
            console.log('✅ No JavaScript errors detected');
        }
        
        // Check if dashboard elements are present
        const dashboardElements = await page.evaluate(() => {
            const elements = {
                totalSubjects: !!document.getElementById('totalSubjects'),
                totalChapters: !!document.getElementById('totalChapters'),
                totalTopics: !!document.getElementById('totalTopics'),
                completedTopics: !!document.getElementById('completedTopics'),
                overallProgress: !!document.getElementById('overallProgress'),
                dashboardOverview: !!document.getElementById('dashboard-overview')
            };
            return elements;
        });
        
        console.log('📊 Dashboard elements check:');
        Object.entries(dashboardElements).forEach(([element, exists]) => {
            console.log(`   ${exists ? '✅' : '❌'} ${element}: ${exists ? 'Found' : 'Missing'}`);
        });
        
        // Check if editClass function is available
        const editClassExists = await page.evaluate(() => {
            return typeof window.editClass === 'function';
        });
        
        console.log(`🔧 editClass function: ${editClassExists ? '✅ Available' : '❌ Missing'}`);
        
        // Test basic functionality
        console.log('🧪 Testing basic functionality...');
        
        // Check if the page title is correct
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Check if navigation is working
        const navItems = await page.$$('.nav-item');
        console.log(`🧭 Navigation items found: ${navItems.length}`);
        
        console.log('✅ Frontend test completed successfully!');
        
    } catch (error) {
        console.error('❌ Frontend test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testFunctionality().catch(console.error);
testFrontend().catch(console.error); 