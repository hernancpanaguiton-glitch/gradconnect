## Network Model

GradConnect follows a Client–Server Network Model. Users open the system in a web browser on a computer, laptop, tablet or smartphone, and their requests travel over the Internet to the application server. The server is made up of four services that run side by side and communicate over a private internal network:

- **Web application** (Laravel), which serves every page, checks each user's role and permissions, and handles requests.
- **Background worker**, which runs the slower AI tasks, such as preparing a résumé for matching and scoring matches, outside the page request so that pages stay fast.
- **Database** (PostgreSQL 16 with the pgvector extension), which stores all records in one place, including the AI representation of every résumé and job posting as a list of 768 numbers that can be compared for similarity.
- **Mail service**, which sends notification emails. In the test deployment, every email is captured by a local mail inbox (Mailpit) instead of being delivered.

For the AI features, the server connects over the Internet to two external services. Groq scores how well a graduate fits a job, with Gemini taking over if Groq does not respond, and Gemini produces the 768-number representations used to shortlist candidates. Keeping the data and processing on one server keeps the records consistent and gives authorized users secure access from anywhere.

The updated diagram is Figure 46 in the Figures part of this document.

## Network Topology

The system uses a Star Topology. Every authorized user connects through the Internet to the central application server, which is the hub of all communication. Within the server, the web application, background worker, database and mail service are linked to one another over a private internal network rather than directly to the Internet. The database accepts connections only from the server itself and is never exposed to users, so all data passes through the web application's access checks. This arrangement keeps management central and means a problem with one user's connection does not affect anyone else.

The updated diagram is Figure 47 in the Figures part of this document.
