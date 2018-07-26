import { Component, OnInit } from '@angular/core';
import {EntityService} from '../entity.service';
import {Attribute, Entity, EntityMeta, EntityRelation, RelationMeta, Relationship} from '../entity';
import {forkJoin} from 'rxjs';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AttributeControlService} from '../attribute/attribute-control.service';
import {MessageService} from 'ui-message/dist/message';
import {msgStore} from '../msgStore';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.css']
})
export class EntityComponent implements OnInit {
  entityMeta: EntityMeta;
  entity: Entity;
  changedEntity: Entity;
  relationMetas: RelationMeta[];
  entityRelations: EntityRelation[];
  formGroup: FormGroup;
  readonly = true;

  constructor(private fb: FormBuilder,
              private attributeControlService: AttributeControlService,
              private messageService: MessageService,
              private entityService: EntityService) {
    this.formGroup = this.fb.group({});
    this.messageService.setMessageStore(msgStore, 'EN');
  }

  ngOnInit() {
    const entityMeta$ = this.entityService.getEntityMeta('person');
    const entityInstance$ = this.entityService.getEntityInstance('7285C9E08D5411E8AA7815A2B5776E65');
    const relationMetas$ = this.entityService.getRelationMetaOfEntity('person');
    const combined$ = forkJoin(entityMeta$, entityInstance$, relationMetas$);

    combined$.subscribe(value => {
      this.entityMeta = value[0];
      this.entity = value[1];
      this.relationMetas = value[2];
      // console.log(this.entity);
      // console.log(this.entityMeta);
      this._createFormFromMeta();
    });
  }

  toggleEditDisplay(): void {
    this.readonly = !this.readonly;
  }

  saveEntity(): void {
    this._composeChangedEntity();
    console.log(this.changedEntity);

    this.entityService.changeEntityInstance(this.changedEntity).subscribe(
      data => {
        if (data['ENTITY_ID']) {
          this.readonly = true;
          this.entity = data;
          console.log(this.entity);
          this.formGroup.reset(this.formGroup.value);
          console.log(this.formGroup);
          this.messageService.reportMessage('ENTITY', 'ENTITY_SAVED', 'S');
        } else {
          if (data instanceof Array) {
            data.forEach(err => this.messageService.add(err));
          } else {
            this.messageService.report(data);
          }
        }
      }
    );
  }

  _composeChangedEntity() {
    if (this.formGroup.dirty === false) {
      return; // Nothing is changed
    }

    this.changedEntity = {};
    this.changedEntity['ENTITY_ID'] = this.entity['ENTITY_ID'];
    this.changedEntity['INSTANCE_GUID'] = this.entity['INSTANCE_GUID'];

    Object.keys(this.formGroup.controls).forEach(key => {
      const control = this.formGroup.controls[key];

      if (control instanceof FormControl && control.dirty === true) {
        this._composeChangedPropertyValue(key, control);
      } else if (control instanceof FormGroup && control.dirty === true) {
        this._composeChangedSingleValueRelation(key, control.controls);
      } else if (control instanceof FormArray && control.dirty === true) {
        this._composeChangedMultiValueRelation(key, control.controls);
      }
    });
  }

  _composeChangedPropertyValue(key, control: FormControl) {
    const attributeMeta = this.entityMeta.ATTRIBUTES.find(attribute => attribute.ATTR_NAME === key);
    this.changedEntity[key] = attributeMeta.IS_MULTI_VALUE ? control.value.split(',') : control.value;
  }

  _composeChangedSingleValueRelation(key, attrControls) {
    this.changedEntity[key] = {};
    if (this.entity[key]) { // Relation instance exists before
      this._getPrimaryKeys(key).forEach(primaryKey => {
        this.changedEntity[key][primaryKey.ATTR_NAME] = this.entity[key][0][primaryKey.ATTR_NAME];
      });

      if (Object.keys(attrControls).length === 0) {
        this.changedEntity[key]['action'] = 'delete';
      } else {
        this.changedEntity[key]['action'] = 'update';
      }
    } else { // Relation instance doesn't exist before
      if (Object.keys(attrControls).length !== 0) {
        this.changedEntity[key]['action'] = 'add';
      }
    }

    if (this.changedEntity[key].action === 'update' || this.changedEntity[key].action === 'add') {
      Object.keys(attrControls).forEach(attrName => {
        const attrControl = attrControls[attrName];
        if (attrControl.dirty === true) {
          this.changedEntity[key][attrName] = attrControl.value;
        }
      });
    }
  }

  _composeChangedMultiValueRelation(key, relationControls) {
    const originalLines = this.entity[key];
    const primaryKeys = this._getPrimaryKeys(key);

    this.changedEntity[key] = [];
    relationControls.forEach(relationFormGroup => {
      const changedLine = {};
      if (relationFormGroup.dirty) {
        const index = originalLines.findIndex( line => {
          let found = false;
          primaryKeys.forEach(primaryKey => {
            found = line[primaryKey.ATTR_NAME] === relationFormGroup.value[primaryKey.ATTR_NAME];
            changedLine[primaryKey.ATTR_NAME] = relationFormGroup.value[primaryKey.ATTR_NAME];
          });
          return found;
        });

        if (index === -1) { // New line
          changedLine['action'] = 'add';
        } else {
          changedLine['action'] = 'update';
          // originalLines.splice(index, 1);
        }

        Object.keys(relationFormGroup.controls).forEach(attrName => {
          const attrControl = relationFormGroup.controls[attrName];
          if (attrControl.dirty === true) {
            changedLine[attrName] = attrControl.value;
          }
        });

        this.changedEntity[key].push(changedLine);
      }
    });

    originalLines.forEach(line => {
      const deleteLine = {action: 'delete'};

      const index = relationControls.findIndex( relationFormGroup => {
        let found = false;
        primaryKeys.forEach(primaryKey => {
          found = line[primaryKey.ATTR_NAME] === relationFormGroup.value[primaryKey.ATTR_NAME];
        });
        return found;
      });

      if (index === -1) { // Original item is not found in the UI
        primaryKeys.forEach(primaryKey => {
          deleteLine[primaryKey.ATTR_NAME] = line[primaryKey.ATTR_NAME];
        });
        this.changedEntity[key].push(deleteLine);
      }

    });
  }

  _getPrimaryKeys(relation): Attribute[] {
    return this.entityRelations.find(ele => {
      return ele.RELATION_ID === relation;
    }).ATTRIBUTES.filter( attribute => attribute.PRIMARY_KEY );
  }

  _createFormFromMeta() {
    this.entityMeta.ATTRIBUTES.forEach(attribute => {
      this.formGroup.addControl(attribute.ATTR_NAME,
        this.attributeControlService.convertToFormControl(attribute, this.entity));
    });

    this.entityRelations = this._getEntityRelations();
    this.entityRelations.forEach(relation => {
      if (!relation.EMPTY) {
        if (relation.CARDINALITY === '[0..1]' || relation.CARDINALITY === '[1..1]') {
          this.formGroup.addControl(relation.RELATION_ID,
            this.attributeControlService.convertToFormGroup(relation.ATTRIBUTES, this.entity[relation.RELATION_ID][0]));
        } else {
          this.formGroup.addControl(relation.RELATION_ID,
            this._convertToFormArray(relation.ATTRIBUTES, this.entity[relation.RELATION_ID]));
        }
      } else {
        this.formGroup.addControl(relation.RELATION_ID, new FormGroup({}));
      }
    });
  }

  _getEntityRelations(): EntityRelation[] {
    const entityRelations: EntityRelation[] = [];
    const relationMetas = this.relationMetas;
    const entity = this.entity;
    this.entityMeta.ROLES.forEach(function (role) {
      role.RELATIONS.forEach(function (relation) {
        const entityRelation = new EntityRelation;
        entityRelation.ROLE_ID = role.ROLE_ID;
        entityRelation.RELATION_ID = relation.RELATION_ID;
        entityRelation.CARDINALITY = relation.CARDINALITY;
        entityRelation.EMPTY = !entity[relation.RELATION_ID];
        entityRelation.ATTRIBUTES = relationMetas.find(ele => {
          return ele.RELATION_ID === relation.RELATION_ID;
        }).ATTRIBUTES;
        entityRelations.push(entityRelation);
      });
    });
    return entityRelations;
  }

  _convertToFormArray(attributes: Attribute[], instance: any) {
    const formArray = [];
    instance.forEach( line => {
      formArray.push(this.attributeControlService.convertToFormGroup(attributes, line));
    });
    return new FormArray(formArray);
  }
}
