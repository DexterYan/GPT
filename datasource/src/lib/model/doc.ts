import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize("postgres://@localhost:5432/docs", {
    logging: false
}) // Example for postgres

const Doc = sequelize.define('doc', {
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
    content: {
        type: DataTypes.TEXT('long')
        // allowNull defaults to true
    },
    embedding: {
        type: DataTypes.TEXT('long')
        // allowNull defaults to true
    }
}, {
    // Other model options go here
});

Doc.sync({ alter: true })

async function saveDoc(url: string, title: string, tags: any[], content: string, embedding: string): Promise<void> {

    await Doc.findOrCreate({
        where: { url: url },
        defaults: { url, title, tags, content, embedding }
    });
}

export { saveDoc };