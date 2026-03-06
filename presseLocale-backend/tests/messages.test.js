// File: cppeurope/user-backend/tests/messages.test.js

const request = require('supertest');
const app = require('../app');
const models = require('../models');
const jwtUtils = require('../utils/jwt.utils');

describe('Messages API - Presse', () => {
  let authToken;
  let testUserId;

  // Setup avant tous les tests
  beforeAll(async () => {
    // Créer un utilisateur de test et obtenir son token
    const testUser = await models.User.create({
      email: `test-${Date.now()}@presse.com`,
      password: '$2a$10$testHashedPassword', // Hash bcrypt fictif
      bio: 'Test user for presse',
      username: `testuser${Date.now()}`
    });
    
    testUserId = testUser.id;
    authToken = jwtUtils.generateTokenForUser(testUser);
  });

  // Nettoyage après tous les tests
  afterAll(async () => {
    // Supprimer les messages de test
    await models.Message.destroy({ where: { userId: testUserId } });
    // Supprimer l'utilisateur de test
    await models.User.destroy({ where: { id: testUserId } });
  });

  describe('POST /api/messages/new - Article uniquement', () => {
    it('devrait créer un article avec titre et contenu', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Article de test',
          content: 'Contenu de test suffisamment long pour passer la validation',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('messageId');
    });

    it('devrait rejeter si titre vide', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '',
          content: 'Contenu valide',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/missing parameters/i);
    });

    it('devrait rejeter si contenu vide', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Titre valide',
          content: '',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/missing parameters/i);
    });

    it('devrait rejeter si titre trop court', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'AB',
          content: 'Contenu valide',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/missing parameters LIMIT/i);
    });

    it('devrait rejeter si contenu trop court', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Titre valide',
          content: 'ABC',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/missing parameters LIMIT/i);
    });
  });

  describe('POST /api/messages/new - Article + Photo', () => {
    it('devrait créer un article avec photo', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Article avec photo',
          content: 'Contenu de test suffisamment long',
          image: 'http://example.com/image.jpg',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('messageId');
    });
  });

  describe('POST /api/messages/new - Article + Vidéo', () => {
    it('devrait créer un article avec vidéo', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Article avec vidéo',
          content: 'Contenu de test suffisamment long',
          video: 'http://example.com/video.mp4',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('messageId');
    });
  });

  describe('POST /api/messages/new - Article + Photo + Vidéo', () => {
    it('devrait créer un article avec photo et vidéo', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Article complet',
          content: 'Contenu de test suffisamment long',
          image: 'http://example.com/image.jpg',
          video: 'http://example.com/video.mp4',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('messageId');
    });
  });

  describe('GET /api/messages/list - Récupération des messages', () => {
    it('devrait lister les messages de presse', async () => {
      // Créer un message de test
      await request(app)
        .post('/api/messages/new')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Message à lister',
          content: 'Contenu de test',
          categ: 'presse'
        });

      const res = await request(app)
        .get('/api/messages/list')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Tests de sécurité', () => {
    it('devrait rejeter sans token', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .send({
          title: 'Titre',
          content: 'Contenu',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(401);
    });

    it('devrait rejeter avec token invalide', async () => {
      const res = await request(app)
        .post('/api/messages/new')
        .set('Authorization', 'Bearer invalidtoken')
        .send({
          title: 'Titre',
          content: 'Contenu',
          categ: 'presse'
        });

      expect(res.statusCode).toBe(401);
    });
  });
});
