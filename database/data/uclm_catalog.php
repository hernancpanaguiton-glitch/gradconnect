<?php

/**
 * The UCLM Lapu-Lapu and Mandaue offerings, as one source of truth.
 *
 * This file is read by CollegeSeeder and SkillCatalogSeeder (colleges,
 * programs, skills and skill aliases), by the landing page's AI match
 * showcase, and by the offline job-title suggestions that keep the job
 * posting autocomplete useful when no AI provider is configured.
 *
 * It is a starting point, not a live registry: administrators adjust the
 * institution's actual offerings through Admin > Colleges & Programs, and the
 * seeders never overwrite a row an administrator has edited.
 *
 * Rules the tests enforce (tests/Unit/Support/UclmCatalogTest.php):
 *  - every college is named "College of …" and its code is globally unique;
 *  - each college lists 15–25 skills, and every skill NAME appears in exactly
 *    one category across the whole file (including 'shared_skills');
 *  - showcase skills exist in the catalogue, salaries are realistic Cebu
 *    entry-level monthly pesos, and the employer is a generic TYPE of
 *    employer rather than a real company;
 *  - job titles are employment roles only.
 */

return [
    'colleges' => [
        [
            'code' => 'CCS',
            'name' => 'College of Computer Studies',
            'short_label' => 'Computer Studies',
            'skill_category' => 'Computing & IT',
            'programs' => [
                ['code' => 'BSCS', 'name' => 'BS Computer Science'],
                ['code' => 'BSIT', 'name' => 'BS Information Technology'],
            ],
            'skills' => [
                'PHP', 'Laravel', 'JavaScript', 'TypeScript', 'React', 'Vue.js',
                'Node.js', 'Python', 'Java', 'MySQL', 'PostgreSQL', 'SQL',
                'Git', 'Docker', 'Linux', 'REST API', 'HTML', 'CSS',
                'Tailwind CSS', 'Networking', 'Data Analysis',
                'Software Testing', 'Technical Support', 'UI/UX Design',
                'Cybersecurity Fundamentals',
            ],
            'job_titles' => [
                'Software Developer',
                'Web Developer',
                'Mobile Application Developer',
                'Systems Analyst',
                'Database Administrator',
                'Network Administrator',
                'Quality Assurance Analyst',
                'IT Support Specialist',
                'Data Analyst',
                'Technical Support Engineer',
            ],
            'showcase' => [
                'job_title' => 'Software Developer',
                'match' => 94,
                'skills' => [
                    ['JavaScript', 92],
                    ['React', 88],
                    ['SQL', 80],
                    ['Git', 76],
                ],
                'employer_type' => 'IT services company',
                'salary' => [28000, 45000],
                'location' => 'Cebu City',
            ],
        ],

        [
            'code' => 'CRIM',
            'name' => 'College of Criminology',
            'short_label' => 'Criminology',
            'skill_category' => 'Criminology & Public Safety',
            'programs' => [
                ['code' => 'BSCRIM', 'name' => 'BS Criminology'],
            ],
            'skills' => [
                'Criminal Investigation', 'Crime Scene Processing', 'Forensic Photography',
                'Fingerprint Analysis', 'Ballistics', 'Polygraph Examination',
                'Criminal Law', 'Evidence Handling', 'Report Writing',
                'Firearms Safety', 'Traffic Management', 'Community Policing',
                'Crowd Control', 'Correctional Administration', 'Criminalistics',
                'Interview and Interrogation', 'Security Management',
                'Disaster Response', 'First Aid', 'Drug Enforcement',
            ],
            'job_titles' => [
                'Police Officer',
                'Security Officer',
                'Security Supervisor',
                'Correctional Officer',
                'Crime Scene Investigator',
                'Forensic Technician',
                'Safety Officer',
                'Fire Officer',
                'Probation Officer',
                'Loss Prevention Officer',
            ],
            'showcase' => [
                'job_title' => 'Safety Officer',
                'match' => 89,
                'skills' => [
                    ['Security Management', 90],
                    ['Criminal Investigation', 84],
                    ['First Aid', 80],
                    ['Report Writing', 75],
                ],
                'employer_type' => 'Industrial park security agency',
                'salary' => [18000, 26000],
                'location' => 'Lapu-Lapu City',
            ],
        ],

        [
            'code' => 'CON',
            'name' => 'College of Nursing',
            'short_label' => 'Nursing',
            'skill_category' => 'Nursing & Healthcare',
            'programs' => [
                ['code' => 'BSN', 'name' => 'BS Nursing'],
            ],
            'skills' => [
                'Patient Assessment', 'Vital Signs Monitoring', 'Medication Administration',
                'Intravenous Therapy', 'Wound Care', 'Basic Life Support',
                'Advanced Cardiac Life Support', 'Infection Control', 'Nursing Documentation',
                'Electronic Health Records', 'Maternal and Child Health Nursing',
                'Community Health Nursing', 'Medical-Surgical Nursing', 'Psychiatric Nursing',
                'Pharmacology', 'Anatomy and Physiology', 'Health Education',
                'Patient Safety', 'Triage', 'Specimen Collection',
            ],
            'job_titles' => [
                'Staff Nurse',
                'Emergency Room Nurse',
                'Operating Room Nurse',
                'Community Health Nurse',
                'School Nurse',
                'Occupational Health Nurse',
                'Clinical Instructor',
                'Medical Records Officer',
            ],
            'showcase' => [
                'job_title' => 'Staff Nurse',
                'match' => 92,
                'skills' => [
                    ['Patient Assessment', 93],
                    ['Medication Administration', 88],
                    ['Basic Life Support', 85],
                    ['Infection Control', 80],
                ],
                'employer_type' => 'Private tertiary hospital',
                'salary' => [22000, 32000],
                'location' => 'Cebu City',
            ],
        ],

        [
            'code' => 'CBA',
            // Seeded as "College of Business" (COB) before the accountancy
            // programs were folded in; CollegeSeeder recodes that row in place
            // so every user and profile already pointing at it follows along.
            'legacy_codes' => ['COB'],
            'legacy_names' => ['College of Business'],
            'name' => 'College of Business and Accountancy',
            'short_label' => 'Business & Accountancy',
            'skill_category' => 'Business & Accounting',
            'programs' => [
                ['code' => 'BSA', 'name' => 'BS Accountancy'],
                ['code' => 'BSBA-FM', 'name' => 'BSBA major in Financial Management'],
                ['code' => 'BSBA-MM', 'name' => 'BSBA major in Marketing Management'],
                ['code' => 'BSBA-HRM', 'name' => 'BSBA major in Human Resource Management'],
                ['code' => 'BSBA-OM', 'name' => 'BSBA major in Operations Management'],
            ],
            'skills' => [
                'Financial Accounting', 'Managerial Accounting', 'Cost Accounting',
                'Auditing', 'Taxation', 'Bookkeeping', 'Financial Analysis',
                'Financial Reporting', 'Budgeting', 'Payroll Processing',
                'Microsoft Excel', 'QuickBooks', 'Marketing Strategy',
                'Market Research', 'Digital Marketing', 'Sales Management',
                'Recruitment and Selection', 'Training and Development',
                'Compensation and Benefits', 'Operations Management',
                'Inventory Management', 'Business Analytics', 'Risk Management',
            ],
            'job_titles' => [
                'Accounting Staff',
                'Junior Auditor',
                'Bookkeeper',
                'Financial Analyst',
                'Payroll Officer',
                'Marketing Associate',
                'Sales Representative',
                'Human Resources Assistant',
                'Operations Supervisor',
                'Management Trainee',
            ],
            'showcase' => [
                'job_title' => 'Accounting Staff',
                'match' => 90,
                'skills' => [
                    ['Financial Accounting', 91],
                    ['Microsoft Excel', 87],
                    ['Bookkeeping', 83],
                    ['Attention to Detail', 79],
                ],
                'employer_type' => 'Business process outsourcing firm',
                'salary' => [20000, 30000],
                'location' => 'Mandaue City',
            ],
        ],

        [
            'code' => 'CCA',
            'name' => 'College of Customs Administration',
            'short_label' => 'Customs Administration',
            'skill_category' => 'Customs & Trade',
            'programs' => [
                ['code' => 'BSCA', 'name' => 'BS Customs Administration'],
            ],
            'skills' => [
                'Customs Documentation', 'Tariff Classification', 'Import and Export Procedures',
                'Customs Brokerage', 'ASEAN Harmonised Tariff Nomenclature', 'Cargo Inspection',
                'Freight Forwarding', 'Supply Chain Management', 'Warehouse Operations',
                'Trade Compliance', 'Customs Valuation', 'Bonded Warehousing',
                'Port Operations', 'Shipping Documentation', 'Incoterms',
                'Logistics Coordination', 'Customs Law', 'Export Licensing',
            ],
            'job_titles' => [
                'Customs Broker',
                'Import Coordinator',
                'Export Documentation Officer',
                'Customs Compliance Officer',
                'Logistics Coordinator',
                'Freight Forwarding Officer',
                'Warehouse Supervisor',
                'Trade Compliance Analyst',
            ],
            'showcase' => [
                'job_title' => 'Import Coordinator',
                'match' => 88,
                'skills' => [
                    ['Customs Documentation', 90],
                    ['Tariff Classification', 85],
                    ['Import and Export Procedures', 82],
                    ['Logistics Coordination', 77],
                ],
                'employer_type' => 'Licensed customs brokerage',
                'salary' => [20000, 30000],
                'location' => 'Cebu City',
            ],
        ],

        [
            'code' => 'CHM',
            'name' => 'College of Hospitality Management',
            'short_label' => 'Hospitality',
            'skill_category' => 'Hospitality & Tourism',
            'programs' => [
                ['code' => 'BSHM', 'name' => 'BS Hospitality Management'],
            ],
            'skills' => [
                'Front Office Operations', 'Housekeeping Operations', 'Food and Beverage Service',
                'Culinary Arts', 'Bartending', 'Banquet Operations',
                'Property Management System', 'Hotel Reservations', 'Tour Guiding',
                'Travel Coordination', 'Event Planning', 'Menu Planning',
                'Food Safety and Sanitation', 'Guest Relations', 'Revenue Management',
                'Baking and Pastry', 'Restaurant Operations', 'Concierge Services',
            ],
            'job_titles' => [
                'Front Office Associate',
                'Guest Services Agent',
                'Food and Beverage Attendant',
                'Restaurant Supervisor',
                'Housekeeping Supervisor',
                'Events Coordinator',
                'Tour Coordinator',
                'Kitchen Commis',
            ],
            'showcase' => [
                'job_title' => 'Front Office Associate',
                'match' => 87,
                'skills' => [
                    ['Front Office Operations', 89],
                    ['Guest Relations', 85],
                    ['Property Management System', 80],
                    ['Customer Service', 78],
                ],
                'employer_type' => 'Beach resort and hotel',
                'salary' => [16000, 24000],
                'location' => 'Lapu-Lapu City',
            ],
        ],

        [
            'code' => 'CED',
            'name' => 'College of Education',
            'short_label' => 'Education',
            'skill_category' => 'Education & Teaching',
            'programs' => [
                ['code' => 'BEED', 'name' => 'Bachelor of Elementary Education'],
                ['code' => 'BSED-ENG', 'name' => 'BSEd major in English'],
                ['code' => 'BSED-FIL', 'name' => 'BSEd major in Filipino'],
                ['code' => 'BSED-MATH', 'name' => 'BSEd major in Mathematics'],
                ['code' => 'BSED-SCI', 'name' => 'BSEd major in Science'],
                ['code' => 'BSED-SS', 'name' => 'BSEd major in Social Studies'],
            ],
            'skills' => [
                'Lesson Planning', 'Classroom Management', 'Curriculum Development',
                'Student Assessment', 'Instructional Materials Development',
                'Educational Technology', 'Early Childhood Education', 'Special Needs Education',
                'Reading Instruction', 'English Language Teaching', 'Filipino Language Teaching',
                'Mathematics Instruction', 'Science Instruction', 'Social Studies Instruction',
                'Differentiated Instruction', 'Action Research', 'Child Development',
                'Blended Learning',
            ],
            'job_titles' => [
                'Elementary School Teacher',
                'Secondary School Teacher',
                'Preschool Teacher',
                'English Teacher',
                'Mathematics Teacher',
                'Science Teacher',
                'Academic Coordinator',
                'Instructional Designer',
            ],
            'showcase' => [
                'job_title' => 'Elementary School Teacher',
                'match' => 91,
                'skills' => [
                    ['Lesson Planning', 92],
                    ['Classroom Management', 88],
                    ['Student Assessment', 84],
                    ['Educational Technology', 78],
                ],
                'employer_type' => 'Private basic education school',
                'salary' => [18000, 26000],
                'location' => 'Mandaue City',
            ],
        ],

        [
            'code' => 'CME',
            'name' => 'College of Marine Engineering',
            'short_label' => 'Marine Engineering',
            'skill_category' => 'Maritime — Engineering',
            'programs' => [
                ['code' => 'BSMARE', 'name' => 'BS Marine Engineering'],
            ],
            'skills' => [
                'Marine Engineering Watchkeeping', 'Marine Diesel Engines', 'Engine Room Operations',
                'Marine Auxiliary Machinery', 'Ship Electrical Systems',
                'Marine Refrigeration and Air Conditioning', 'Welding and Fabrication',
                'Hydraulics and Pneumatics', 'Machine Shop Practice', 'Marine Boilers',
                'Preventive Maintenance', 'Fuel and Lubricant Management',
                'Marine Pollution Prevention', 'Shipboard Safety', 'Engine Performance Monitoring',
                'Bunkering Operations', 'Marine Automation and Control', 'Damage Control',
            ],
            'job_titles' => [
                'Marine Engineering Cadet',
                'Fourth Engineer',
                'Third Engineer',
                'Engine Rating',
                'Marine Maintenance Technician',
                'Shipyard Engineering Assistant',
                'Port Engineering Assistant',
                'Marine Surveyor Assistant',
            ],
            'showcase' => [
                'job_title' => 'Marine Engineering Cadet',
                'match' => 86,
                'skills' => [
                    ['Engine Room Operations', 88],
                    ['Marine Diesel Engines', 84],
                    ['Shipboard Safety', 81],
                    ['Preventive Maintenance', 76],
                ],
                'employer_type' => 'International shipping manning agency',
                'salary' => [25000, 40000],
                'location' => 'Cebu City',
            ],
        ],

        [
            'code' => 'CMT',
            'name' => 'College of Marine Transportation',
            'short_label' => 'Marine Transportation',
            'skill_category' => 'Maritime — Navigation',
            'programs' => [
                ['code' => 'BSMT', 'name' => 'BS Marine Transportation'],
            ],
            'skills' => [
                'Navigation Watchkeeping', 'Celestial Navigation', 'Terrestrial Navigation',
                'Electronic Chart Display and Information System', 'Radar and ARPA Operation',
                'Collision Regulations', 'Ship Handling', 'Cargo Stowage and Securing',
                'Ship Stability', 'Meteorology and Oceanography', 'Voyage Planning',
                'Maritime Communications', 'Search and Rescue Operations',
                'Survival Craft Operation', 'Bridge Resource Management', 'Maritime Law',
                'Anchoring and Mooring', 'Port State Control Compliance',
            ],
            'job_titles' => [
                'Deck Cadet',
                'Third Mate',
                'Second Mate',
                'Able Seafarer Deck',
                'Port Operations Assistant',
                'Vessel Traffic Assistant',
                'Marine Cargo Surveyor',
                'Harbour Pilot Trainee',
            ],
            'showcase' => [
                'job_title' => 'Deck Cadet',
                'match' => 85,
                'skills' => [
                    ['Navigation Watchkeeping', 88],
                    ['Collision Regulations', 83],
                    ['Voyage Planning', 79],
                    ['Ship Stability', 75],
                ],
                'employer_type' => 'Ocean-going vessel operator',
                'salary' => [25000, 40000],
                'location' => 'Cebu City',
            ],
        ],

        [
            'code' => 'COE',
            'name' => 'College of Engineering',
            'short_label' => 'Engineering',
            'skill_category' => 'Engineering',
            'programs' => [
                ['code' => 'BSCE', 'name' => 'BS Civil Engineering'],
                ['code' => 'BSEE', 'name' => 'BS Electrical Engineering'],
                ['code' => 'BSME', 'name' => 'BS Mechanical Engineering'],
                ['code' => 'BSCPE', 'name' => 'BS Computer Engineering'],
                ['code' => 'BSIE', 'name' => 'BS Industrial Engineering'],
            ],
            'skills' => [
                'AutoCAD', 'MATLAB', 'Structural Analysis', 'Reinforced Concrete Design',
                'Surveying', 'Construction Management', 'Construction Estimating',
                'Geotechnical Engineering', 'Electrical Circuit Design', 'Power Systems Analysis',
                'Electrical Systems Design', 'Programmable Logic Controllers', 'Thermodynamics',
                'Machine Design', 'Fluid Mechanics', 'Computer-Aided Manufacturing',
                'Embedded Systems', 'Microcontroller Programming', 'Digital Logic Design',
                'Industrial Process Improvement', 'Quality Control',
                'Occupational Safety and Health', 'Materials Testing',
            ],
            'job_titles' => [
                'Civil Engineer',
                'Electrical Engineer',
                'Mechanical Engineer',
                'Computer Engineer',
                'Industrial Engineer',
                'Project Engineer',
                'Site Engineer',
                'Quality Assurance Engineer',
                'Maintenance Engineer',
                'CAD Technician',
            ],
            'showcase' => [
                'job_title' => 'Site Engineer',
                'match' => 90,
                'skills' => [
                    ['AutoCAD', 90],
                    ['Structural Analysis', 86],
                    ['Construction Management', 82],
                    ['Quality Control', 77],
                ],
                'employer_type' => 'General construction contractor',
                'salary' => [22000, 34000],
                'location' => 'Mandaue City',
            ],
        ],
    ],

    /**
     * Categories that belong to no single college. Keeping them out of the
     * per-college lists is what lets every skill NAME live in exactly one
     * category, which the taxonomy and the skill pickers both rely on.
     */
    'shared_skills' => [
        'Soft Skills' => [
            'Communication',
            'Problem Solving',
            'Project Management',
            'Teamwork',
            'Leadership',
            'Critical Thinking',
            'Time Management',
            'Adaptability',
            'Attention to Detail',
            'Customer Service',
            'Conflict Resolution',
            'Public Speaking',
        ],
    ],

    /**
     * Abbreviations graduates actually type, mapped to the canonical skill
     * name. SkillCatalogSeeder skips any alias that is already a skill in its
     * own right, mirroring the rule in Admin\SkillTaxonomyController.
     */
    'skill_aliases' => [
        'BLS' => 'Basic Life Support',
        'CPR' => 'Basic Life Support',
        'ACLS' => 'Advanced Cardiac Life Support',
        'EHR' => 'Electronic Health Records',
        'Excel' => 'Microsoft Excel',
        'MS Excel' => 'Microsoft Excel',
        'PMS' => 'Property Management System',
        'AHTN' => 'ASEAN Harmonised Tariff Nomenclature',
        'COLREGs' => 'Collision Regulations',
        'PLC' => 'Programmable Logic Controllers',
    ],
];
