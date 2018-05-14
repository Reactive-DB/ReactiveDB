import { TeambitionTypes, Database, RDBType, Relationship } from '../index'

export interface ProjectSchema {
  _id: TeambitionTypes.ProjectId
  name: string
  isArchived: boolean
  posts: any
}
export default (db: Database) => db.defineSchema<ProjectSchema>('Project', {
  _id: {
    type: RDBType.STRING,
    primaryKey: true
  },
  name: {
    type: RDBType.STRING
  },
  isArchived: {
    type: RDBType.BOOLEAN
  },
  posts: {
    type: Relationship.oneToMany,
    virtual: {
      name: 'Post',
      where: (ref) => ({
        _id: ref.belongTo
      })
    }
  }
})
