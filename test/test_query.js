/**
 * Created by VinceZK on 06/29/18.
 */
const entityDB = require('../server/models/connections/sql_mdb.js');
const query = require('../server/models/query.js');

describe('query tests', function () {
  before(function (done) {
    entityDB.loadEntity('person', done);
  });

  let queryObject =
    {
      ENTITY_ID: 'person',
      RELATION_ID: 'r_user',

      PROJECTION: [
        'USER_ID',
        'USER_NAME',
        'GIVEN_NAME',
        {FIELD_NAME: 'COMPANY_ID', ALIAS: 'Company', RELATION_ID: 'r_employee'}
      ],

      FILTER: [
        {
          FIELD_NAME: 'USER_ID',
          OPERATOR: 'BT',
          LOW: 'DH001',
          HIGH: 'DH006'
        },
        {
          FIELD_NAME: 'LANGUAGE',
          OPERATOR: 'EQ',
          RELATION_ID: 'r_personalization',
          LOW: 'ZH'
        }
      ],

      sort: []
    };

  it('should return query result', function(done){
    query.run(queryObject, function (errs, rows) {
      should(errs).eql(null);
      // console.log(rows);
      done();
    });
  });

  it('should report missing relation', function(done){
    delete queryObject.RELATION_ID;
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'MISS_RELATION',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report relationship relation is not supported', function (done) {
    queryObject.RELATION_ID = 'rs_marriage';
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'RELATIONSHIP_RELATION_NOT_SUPPORTED',
        msgType: 'E'
      }]);
      done();
    })
  });

  it('should report invalid relation', function(done){
    queryObject.RELATION_ID = 'r_invalid_relation';
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_RELATION',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report invalid relation in projected field', function(done){
    queryObject.RELATION_ID = 'r_user';
    queryObject.PROJECTION[3].RELATION_ID = 'r_invalid_relation';
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_RELATION',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report invalid field in projection', function(done){
    queryObject.PROJECTION[0] = 'INVALID_FIELD';
    queryObject.PROJECTION[3].RELATION_ID = 'r_employee';
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_FIELD',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report invalid filter', function(done){
    queryObject.PROJECTION[0] = 'USER_ID';
    queryObject.FILTER = 'xxxxxx';
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_FILTER',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report invalid field in the filter', function(done){
    queryObject.FILTER = [
      {
        FIELD_NAME: 'INVALID_FIELD',
        OPERATOR: 'BT',
        LOW: 'DH002',
        HIGH: 'DH006'
      }
    ];
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_FIELD',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report invalid relation in the filter', function(done){
    queryObject.FILTER = [
      {
        FIELD_NAME: 'LANGUAGE',
        OPERATOR: 'EQ',
        RELATION_ID: 'r_personalization1',
        LOW: 'ZH'
      }
    ];
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_RELATION',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report invalid operator in the filter', function(done){
    queryObject.FILTER = [
      {
        FIELD_NAME: 'LANGUAGE',
        OPERATOR: 'AA',
        RELATION_ID: 'r_personalization',
        LOW: 'ZH'
      }
    ];
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_OPERATOR',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report INVALID_SORT', function(done){
    queryObject.FILTER = [];
    queryObject.SORT = [
      {
        RELATION_ID: 'r_personalization'
      }
    ];
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_SORT',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report INVALID_RELATION', function(done){
    queryObject.FILTER = [];
    queryObject.SORT = [
      {
        FIELD_NAME: 'LANGUAGE',
        RELATION_ID: 'r_personalization1'
      }
    ];
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_RELATION',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should report INVALID_FIELD', function(done){
    queryObject.FILTER = [];
    queryObject.SORT = [
      {
        FIELD_NAME: 'LANGUAGE1',
        RELATION_ID: 'r_personalization'
      }
    ];
    query.run(queryObject, function (errs) {
      errs.should.containDeep([{
        msgCat: 'QUERY',
        msgName: 'INVALID_FIELD',
        msgType: 'E'
      }]);
      done();
    });
  });

  it('should return query result with sorting', function(done){
    queryObject.FILTER = [];
    queryObject.SORT = [
      {
        FIELD_NAME: 'LANGUAGE',
        RELATION_ID: 'r_personalization',
        ORDER: 'DESC'
      }
    ];
    query.run(queryObject, function (errs) {
      should(errs).eql(null);
      done();
    });
  });

  after('Close the MDB', function (done) {
    entityDB.closeMDB(done);
  })
});
