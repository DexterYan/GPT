import { Sequelize, DataTypes } from "sequelize";


const sequelize = new Sequelize("postgres://@localhost:5432/github", {
    logging: false
})

const Issue = sequelize.define('issue', {
    // Model attributes are defined here
    url: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    title: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    tags: {
        type: DataTypes.JSONB
    },
    description: {
        type: DataTypes.TEXT('long')
        // allowNull defaults to true
    },
    owner: {
        type: DataTypes.STRING(500),
        // allowNull defaults to true
    },
    repo: {
        type: DataTypes.STRING(500),
        // allowNull defaults to true
    }
}, {
    // Other model options go here
});

Issue.sync({ alter: true })

async function saveIssue(url: string, title: string, tags: any[], description: string, owner: string, repo: string): Promise<void> {

    await Issue.findOrCreate({
        where: { url: url },
        defaults: { url, title, tags, description, owner, repo }
    });
}
export { saveIssue };
