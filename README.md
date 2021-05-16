# Database Course Project

## Getting Started

Clone or download source files. And run:
```
npm install
```

## How to import backup.json to Cloud Firestore

1. Create to your firebase project.
2. Create an firebase app.
3. Go to `Project settings` > `Service accounts`
4. On the Firebase Admin SDK tab, Click `Generate new private key`
5. Save the credentials file on your computer.
6. Install `node-firestore-import-export` by:
```
npm install -g node-firestore-import-export
```
7. Import the data by this command:
```
firestore-import -a path/to/credentials/file.json -b path/to/backup.json
```
