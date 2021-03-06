const entity = require('../models/entity.js');
const entityDB = require('../models/connections/sql_mdb.js');

module.exports = {
  listEntityID: function (req, res) {
    res.json(entityDB.listEntityID())
  },

  getEntityMeta: function (req, res) {
    res.json(entity.getEntityMeta(req.params['entityID']))
  },

  getEntityInstance: function (req, res, next) {
    entity.getInstanceByGUID(req.params['instanceGUID'], function (err, instance) {
      if(err)res.json(err);
      else {
        req.body = instance;
        next();
      }
    });
  },

  getEntityInstanceByID: function (req, res) {
    entity.getInstanceByID(req.body, function (err, instance) {
      if(err)res.json(err);
      else res.json(instance);
    });
  },

  getEntityInstancePieceByGUID: function(req, res) {
    entity.getInstancePieceByGUID(req.params['instanceGUID'], req.body, function (err, instance) {
      if(err)res.json(err);
      else res.json(instance);
    })
  },

  getEntityInstancePieceByID: function(req, res) {
    entity.getInstancePieceByID(req.body['ID'], req.body['piece'], function (err, instance) {
      if(err)res.json(err);
      else res.json(instance);
    })
  },

  getRelationMeta: function (req, res) {
    res.json(entity.getRelationMeta(req.params['relationID']));
  },

  getRelationMetaOfEntity: function (req, res) {
    res.json(entity.getRelationMetaOfEntity(req.params['entityID']));
  },
  
  createInstance: function (req, res, next) {
    entity.createInstance(req.body, function (err) {
      if(err) res.json(err);
      else next();
    })
  },

  changeInstance: function (req, res, next) {
    entity.changeInstance(req.body, function (err) {
      if(err) res.json(err);
      else next();
    })
  },

  overwriteInstance: function (req, res, next) {
    entity.overwriteInstance(req.body, function (err) {
      if(err) res.json(err);
      else next();
    })
  },

  softDeleteInstance: function(req, res, next) {
    entity.softDeleteInstanceByGUID(req.params['instanceGUID'], function (err) {
      if (err) res.json(err);
      else next();
    })
  },

  restoreInstance: function(req, res) {
    entity.restoreInstanceByGUID(req.params['instanceGUID'], function (err) {
      res.json(err);
    })
  },

  deleteInstance: function (req, res, next) {
    entity.hardDeleteByGUID(req.params['instanceGUID'], function (err) {
      if (err) res.json(err);
      else next();
    })
  }
};
